export type ComplaintType = 
  | 'FOOD_QUALITY'
  | 'LATE_DELIVERY'
  | 'MISSING_ITEM'
  | 'PAYMENT_ISSUE'
  | 'REFUND_ISSUE'
  | 'KITCHEN_HYGIENE'
  | 'CHEF_BEHAVIOUR'
  | 'CUSTOMER_BEHAVIOUR'
  | 'TECHNICAL_ISSUE';

export type ComplaintStatus = 
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'ESCALATED';

export interface Complaint {
  id: string;
  reporter_id: string; // User who reported
  target_id?: string; // E.g. order_id, chef_id, customer_id
  type: ComplaintType;
  description: string;
  status: ComplaintStatus;
  assigned_to?: string;
  resolution_notes?: string;
  created_at?: string;
  updated_at?: string;
}
