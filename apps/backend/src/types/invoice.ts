export type InvoiceType = 'CONSUMER_ORDER' | 'CHEF_SETTLEMENT' | 'CREDIT_NOTE' | 'DEBIT_NOTE';

export interface Invoice {
  id: string;
  invoice_number: string;
  reference_id: string; // order_id or settlement_id
  type: InvoiceType;
  issued_to: string; // profile_id
  subtotal: number;
  tax_total: number;
  discount_total: number;
  grand_total: number;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';
  issued_at?: string;
  download_url?: string;
}

export type PayoutStatus = 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED';

export interface PayoutBankDetails {
  holder: string;
  ifsc: string;
  account: string;
}

export interface PayoutRequest {
  id: string;
  kitchen_id: string;
  amount: number;
  // A snapshot of the kitchen's saved bank account at request time, resolved
  // server-side from the kitchen profile — never taken from the client.
  bank_details: PayoutBankDetails;
  status: PayoutStatus;
  reference_id?: string;
  requested_at?: string;
  processed_at?: string;
}
