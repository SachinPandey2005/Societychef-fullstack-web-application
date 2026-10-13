export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUEST_RESUBMISSION' | 'SUSPENDED';

export interface KitchenVerification {
  id: string;
  kitchen_id: string;
  status: VerificationStatus;
  documents_url?: string[];
  hygiene_records_url?: string[];
  verifier_id?: string;
  verification_notes?: string;
  verification_date?: string;
  created_at?: string;
  updated_at?: string;
}
