import firebaseConfig from '../../firebase-applet-config.json';
import { getAccessToken, googleSignIn } from './googleAuth';
import { executePythonAgent } from './pythonApiService';

export interface RealGmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  rawDate: Date;
  bodyText: string;
  hasAttachments: boolean;
  attachments: {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
  }[];
  isRateCon: boolean;
  isInvoiceOrRemittance: boolean;
  parsedFreightData?: {
    loadNumber?: string;
    rate?: number;
    brokerName?: string;
    origin?: string;
    destination?: string;
    equipment?: string;
    commodity?: string;
    weight?: string;
    pickupDate?: string;
    deliveryDate?: string;
  };
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  threadId?: string;
  inReplyTo?: string;
  attachments?: {
    filename: string;
    mimeType: string;
    contentBase64: string;
  }[];
}

export interface GmailDraftPayload {
  threadId?: string;
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
}

/**
 * Returns the configured OAuth Client ID from firebase-applet-config.json
 */
export function getOAuthClientId(): string {
  return firebaseConfig.oAuthClientId || '';
}

/**
 * Ensure the user has an active Google Workspace access token.
 */
export async function getGmailAccessToken(forcePrompt = false): Promise<string> {
  let token = await getAccessToken();
  if (!token || forcePrompt) {
    const authResult = await googleSignIn();
    if (!authResult?.accessToken) {
      throw new Error('Failed to acquire Google access token. Please sign in with Google.');
    }
    token = authResult.accessToken;
  }
  return token;
}

/**
 * Helper to decode base64url standard strings from Gmail API payload
 */
function decodeBase64Url(data: string): string {
  try {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    try {
      return atob(data.replace(/-/g, '+').replace(/_/g, '/'));
    } catch {
      return '';
    }
  }
}

/**
 * Recursively parse email body parts to retrieve plain text and attachment metadata
 */
function parseMessagePart(part: any, result: { text: string; attachments: any[] }) {
  if (!part) return;

  if (part.mimeType === 'text/plain' && part.body && part.body.data) {
    result.text += decodeBase64Url(part.body.data) + '\n';
  } else if (part.filename && part.filename.length > 0 && part.body) {
    result.attachments.push({
      id: part.body.attachmentId || part.partId,
      filename: part.filename,
      mimeType: part.mimeType || 'application/octet-stream',
      size: part.body.size || 0
    });
  }

  if (part.parts && Array.isArray(part.parts)) {
    for (const subPart of part.parts) {
      parseMessagePart(subPart, result);
    }
  }
}

/**
 * Extract freight load details from email text & headers using Gemini and Python engine
 */
export async function extractFreightFromMessageText(
  subject: string, 
  snippet: string, 
  bodyText: string,
  fromSender?: string
): Promise<RealGmailMessage['parsedFreightData']> {
  const combined = `Sender: ${fromSender || ''}\nSubject: ${subject}\nSnippet: ${snippet}\nBody:\n${bodyText}`;

  // Call Server-side Gemini API route first for intelligent extraction
  try {
    const geminiRes = await fetch('/api/gemini/parse-ratecon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawEmailText: bodyText,
        emailSubject: subject,
        fromSender: fromSender || ''
      })
    });

    if (geminiRes.ok) {
      const gData = await geminiRes.json();
      if (gData && gData.loadNumber) {
        return {
          loadNumber: gData.loadNumber,
          rate: gData.rate || gData.linehaulPay,
          brokerName: gData.broker,
          origin: gData.originCity ? `${gData.originCity}, ${gData.originState || ''}` : undefined,
          destination: gData.destCity ? `${gData.destCity}, ${gData.destState || ''}` : undefined,
          equipment: gData.equipmentType || '53ft Reefer',
          commodity: gData.commodity || 'General Freight',
          weight: gData.weightLbs ? `${gData.weightLbs} lbs` : undefined,
          pickupDate: gData.pickupDate,
          deliveryDate: gData.deliveryDate
        };
      }
    }
  } catch (err) {
    console.warn('Gemini RateCon API fallback to Python agent:', err);
  }

  // Python Agent fallback
  try {
    const pythonResult = await executePythonAgent('parse_ratecon', { emailText: combined });
    if (pythonResult.success && pythonResult.data) {
      const d = pythonResult.data;
      return {
        loadNumber: d.loadNumber || extractLoadNumber(combined),
        rate: d.totalPay || extractRateAmount(combined),
        brokerName: d.brokerName || extractBrokerName(combined),
        origin: d.origin || extractOrigin(combined),
        destination: d.destination || extractDestination(combined),
        equipment: d.equipment || '53ft Reefer',
        commodity: d.commodity || 'General Freight',
        weight: d.weight ? `${d.weight} lbs` : undefined
      };
    }
  } catch (e) {
    console.warn('Python agent fallback to regex parsing:', e);
  }

  return {
    loadNumber: extractLoadNumber(combined),
    rate: extractRateAmount(combined),
    brokerName: extractBrokerName(combined),
    origin: extractOrigin(combined),
    destination: extractDestination(combined),
    equipment: /reefer|temp/i.test(combined) ? '53ft Reefer' : '53ft Dry Van'
  };
}

function extractLoadNumber(text: string): string | undefined {
  const match = text.match(/(?:Load|Rate\s*Con|Tender|PO|Ref|Order)\s*#?\s*:?\s*([A-Z0-9]{4,15})/i) ||
                text.match(/#\s*([A-Z0-9-]{5,15})/i);
  return match ? match[1] : undefined;
}

function extractRateAmount(text: string): number | undefined {
  const match = text.match(/(?:\$|USD\s*|Rate:\s*|Pay:\s*|Total:\s*)(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
  if (match) {
    const num = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(num) && num > 100) return num;
  }
  return undefined;
}

function extractBrokerName(text: string): string | undefined {
  if (/ch\s*robinson/i.test(text)) return 'C.H. Robinson Worldwide';
  if (/tql|total\s*quality/i.test(text)) return 'Total Quality Logistics (TQL)';
  if (/coyote/i.test(text)) return 'Coyote Logistics';
  if (/landstar/i.test(text)) return 'Landstar System';
  if (/echo/i.test(text)) return 'Echo Global Logistics';
  if (/rxo|xpo/i.test(text)) return 'RXO Logistics';
  if (/j\.?b\.?\s*hunt/i.test(text)) return 'J.B. Hunt Transport';
  if (/uber\s*freight/i.test(text)) return 'Uber Freight';
  return undefined;
}

function extractOrigin(text: string): string | undefined {
  const match = text.match(/(?:Origin|Pickup|From|PU)\s*:?\s*([A-Za-z\s]+,\s*[A-Z]{2})/i);
  return match ? match[1].trim() : undefined;
}

function extractDestination(text: string): string | undefined {
  const match = text.match(/(?:Destination|Delivery|To|DEL|SO)\s*:?\s*([A-Za-z\s]+,\s*[A-Z]{2})/i);
  return match ? match[1].trim() : undefined;
}

/**
 * Fetch real unread freight emails from the user's actual Gmail inbox
 */
export async function searchUnreadFreightEmails(maxResults = 10): Promise<{ messages: RealGmailMessage[]; error?: string }> {
  const query = 'is:unread (subject:ratecon OR subject:freight OR subject:load OR subject:tender OR subject:bol OR subject:confirmation OR label:INBOX)';
  return fetchRealGmailInbox(query, maxResults);
}

/**
 * Fetch real inbox messages from the user's authenticated Gmail account
 */
export async function fetchRealGmailInbox(
  query = 'label:INBOX',
  maxResults = 15
): Promise<{ messages: RealGmailMessage[]; error?: string }> {
  try {
    const token = await getGmailAccessToken();
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;

    const listRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!listRes.ok) {
      if (listRes.status === 401) {
        const freshToken = await getGmailAccessToken(true);
        const retryRes = await fetch(url, { headers: { Authorization: `Bearer ${freshToken}` } });
        if (!retryRes.ok) throw new Error(`Gmail API HTTP ${retryRes.status}: ${await retryRes.text()}`);
      } else {
        throw new Error(`Gmail API HTTP ${listRes.status}`);
      }
    }

    const listData = await listRes.json();
    if (!listData.messages || listData.messages.length === 0) {
      return { messages: [] };
    }

    const messagePromises = listData.messages.map(async (msgItem: { id: string }) => {
      const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgItem.id}?format=full`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!msgRes.ok) return null;

      const detail = await msgRes.json();
      const headers = detail.payload?.headers || [];

      const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
      const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
      const toHeader = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value || '';
      const dateHeader = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || new Date().toISOString();

      const bodyData = { text: '', attachments: [] };
      parseMessagePart(detail.payload, bodyData);

      const combinedText = `${subjectHeader} ${detail.snippet || ''} ${bodyData.text}`;
      const isRateCon = /rate\s*con|tender|load|freight|bol|po#|confirmation/i.test(combinedText);
      const isInvoiceOrRemittance = /invoice|remittance|payment|eob|check|ach|stub/i.test(combinedText);

      const parsedFreightData = isRateCon || isInvoiceOrRemittance 
        ? await extractFreightFromMessageText(subjectHeader, detail.snippet || '', bodyData.text, fromHeader)
        : undefined;

      const rawDate = new Date(dateHeader);
      const formattedDate = !isNaN(rawDate.getTime()) 
        ? `${rawDate.toLocaleDateString()} ${rawDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : dateHeader;

      const realMsg: RealGmailMessage = {
        id: detail.id,
        threadId: detail.threadId,
        snippet: detail.snippet || '',
        subject: subjectHeader,
        from: fromHeader,
        to: toHeader,
        date: formattedDate,
        rawDate: isNaN(rawDate.getTime()) ? new Date() : rawDate,
        bodyText: bodyData.text || detail.snippet || '',
        hasAttachments: bodyData.attachments.length > 0,
        attachments: bodyData.attachments,
        isRateCon,
        isInvoiceOrRemittance,
        parsedFreightData
      };

      return realMsg;
    });

    const results = await Promise.all(messagePromises);
    const messages = results.filter((m): m is RealGmailMessage => m !== null);

    return { messages };
  } catch (error: any) {
    console.error('Error in fetchRealGmailInbox:', error);
    return { messages: [], error: error.message || 'Failed to connect to Gmail API' };
  }
}

/**
 * Construct an RFC 2822 compliant raw MIME message and encode as base64url
 */
function createRawMimeEmail(payload: SendEmailPayload): string {
  const boundary = `----=_Part_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  
  let mimeLines: string[] = [
    `To: ${payload.to}`,
    payload.cc ? `Cc: ${payload.cc}` : null,
    `Subject: ${payload.subject}`,
    payload.inReplyTo ? `In-Reply-To: ${payload.inReplyTo}` : null,
    payload.inReplyTo ? `References: ${payload.inReplyTo}` : null,
    'MIME-Version: 1.0',
  ].filter(Boolean) as string[];

  if (payload.attachments && payload.attachments.length > 0) {
    mimeLines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    mimeLines.push('');
    mimeLines.push(`--${boundary}`);
    mimeLines.push('Content-Type: text/plain; charset=UTF-8');
    mimeLines.push('Content-Transfer-Encoding: 7bit');
    mimeLines.push('');
    mimeLines.push(payload.body);

    for (const att of payload.attachments) {
      mimeLines.push('');
      mimeLines.push(`--${boundary}`);
      mimeLines.push(`Content-Type: ${att.mimeType}; name="${att.filename}"`);
      mimeLines.push(`Content-Disposition: attachment; filename="${att.filename}"`);
      mimeLines.push('Content-Transfer-Encoding: base64');
      mimeLines.push('');
      mimeLines.push(att.contentBase64);
    }
    mimeLines.push('');
    mimeLines.push(`--${boundary}--`);
  } else {
    mimeLines.push('Content-Type: text/plain; charset=UTF-8');
    mimeLines.push('');
    mimeLines.push(payload.body);
  }

  const rawString = mimeLines.join('\r\n');

  const base64 = btoa(
    encodeURIComponent(rawString).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Send email directly via the user's authenticated Gmail API account
 */
export async function sendEmailViaRealGmail(payload: SendEmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const token = await getGmailAccessToken();
    const rawEmail = createRawMimeEmail(payload);

    const bodyObj: any = { raw: rawEmail };
    if (payload.threadId) {
      bodyObj.threadId = payload.threadId;
    }

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyObj)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gmail Send API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return { success: true, messageId: data.id };
  } catch (error: any) {
    console.error('Error sending email via Gmail API:', error);
    return { success: false, error: error.message || 'Failed to send email via Gmail API' };
  }
}

/**
 * Create a draft reply in the user's actual Gmail Drafts folder
 */
export async function createGmailDraftReply(payload: GmailDraftPayload): Promise<{ success: boolean; draftId?: string; error?: string }> {
  try {
    const token = await getGmailAccessToken();
    const rawEmail = createRawMimeEmail({
      to: payload.to,
      subject: payload.subject,
      body: payload.body,
      inReplyTo: payload.inReplyTo
    });

    const draftBody: any = {
      message: {
        raw: rawEmail,
        threadId: payload.threadId
      }
    };

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(draftBody)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gmail Draft API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return { success: true, draftId: data.id };
  } catch (error: any) {
    console.error('Error creating draft in Gmail:', error);
    return { success: false, error: error.message || 'Failed to create Gmail draft' };
  }
}

/**
 * Mark a Gmail message as READ by removing UNREAD label
 */
export async function markGmailAsRead(messageId: string): Promise<boolean> {
  try {
    const token = await getGmailAccessToken();
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ removeLabelIds: ['UNREAD'] })
    });
    return res.ok;
  } catch (err) {
    console.error('Error marking message as read in Gmail:', err);
    return false;
  }
}

/**
 * Fetch a specific attachment from Gmail
 */
export async function fetchGmailAttachmentContent(messageId: string, attachmentId: string): Promise<string | null> {
  try {
    const token = await getGmailAccessToken();
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch (err) {
    console.error('Error fetching Gmail attachment:', err);
    return null;
  }
}
