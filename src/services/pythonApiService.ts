/**
 * Client service connecting React frontend to Python 3.10 Backend Services
 */

export async function executePythonAgent(action: string, inputData: any) {
  try {
    const res = await fetch('/api/python/agent-execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, inputData })
    });
    return await res.json();
  } catch (err: any) {
    console.warn('Python Agent API warning:', err.message);
    return { error: err.message };
  }
}

export async function parseDocumentViaPython(fileName: string, fileText: string = '') {
  try {
    const res = await fetch('/api/python/parse-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, fileText })
    });
    return await res.json();
  } catch (err: any) {
    console.warn('Python Document Parser API warning:', err.message);
    return { error: err.message };
  }
}

export async function getCompanyProfileFromPythonDB() {
  try {
    const res = await fetch('/api/python/company-profile');
    return await res.json();
  } catch (err: any) {
    console.warn('Python DB Company Profile warning:', err.message);
    return null;
  }
}

export async function saveCompanyProfileToPythonDB(profile: any) {
  try {
    const res = await fetch('/api/python/company-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    return await res.json();
  } catch (err: any) {
    console.warn('Python DB Save Profile warning:', err.message);
    return { success: false };
  }
}

export async function getInvoicesFromPythonDB() {
  try {
    const res = await fetch('/api/python/invoices');
    return await res.json();
  } catch (err: any) {
    console.warn('Python DB Invoices warning:', err.message);
    return [];
  }
}

export async function saveInvoiceToPythonDB(invoice: any) {
  try {
    const res = await fetch('/api/python/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice)
    });
    return await res.json();
  } catch (err: any) {
    console.warn('Python DB Save Invoice warning:', err.message);
    return { success: false };
  }
}

export async function recordPaymentInPythonDB(
  invoiceId: string, 
  amount: number, 
  refNumber: string, 
  paymentMethod = 'ACH', 
  paymentDate = new Date().toISOString().split('T')[0]
) {
  try {
    const res = await fetch('/api/python/record-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId, amount, refNumber, paymentMethod, paymentDate })
    });
    return await res.json();
  } catch (err: any) {
    console.warn('Python DB Payment Record warning:', err.message);
    return { success: false };
  }
}
