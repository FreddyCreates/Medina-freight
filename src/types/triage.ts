export type RuleConditionField = 'subject' | 'from' | 'body' | 'has_attachments';
export type RuleOperator = 'contains' | 'not_contains' | 'equals' | 'starts_with' | 'regex';

export type RuleActionType = 
  | 'extract_and_draft_project' 
  | 'sync_calendar' 
  | 'create_contract_doc' 
  | 'generate_billing_email' 
  | 'auto_reply_confirmation' 
  | 'flag_dispute'
  | 'apply_gmail_label';

export interface TriageCondition {
  field: RuleConditionField;
  operator: RuleOperator;
  value: string;
}

export interface CustomTriageRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: TriageCondition[];
  actionType: RuleActionType;
  actionExecutionMode: 'auto_execute' | 'suggest_action';
  priority: number;
  matchedCount: number;
  lastTriggeredAt?: string;
  color: string;
}

export interface SuggestedThreadAction {
  id: string;
  type: RuleActionType;
  label: string;
  description: string;
  confidence: number;
  iconName?: string;
  executed?: boolean;
  executedAt?: string;
  executionResultSummary?: string;
  payload?: any;
}

export interface TriagedThread {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  hasAttachments: boolean;
  matchedRuleId?: string;
  matchedRuleName?: string;
  status: 'pending_action' | 'auto_executed' | 'action_taken' | 'dismissed';
  intent: 'rate_confirmation' | 'load_tender' | 'payment_notice' | 'detention_claim' | 'driver_pod' | 'general_logistics';
  confidenceScore: number;
  aiReasoning: string;
  suggestedActions: SuggestedThreadAction[];
  extractedLoadDetails?: {
    loadNumber: string;
    broker: string;
    originCity: string;
    originState: string;
    destCity: string;
    destState: string;
    rate: number;
    equipment: '53ft Dry Van' | '53ft Reefer' | 'Flatbed' | 'Stepdeck';
    pickupDate: string;
    deliveryDate: string;
  } | null;
  historyLogs?: string[];
}
