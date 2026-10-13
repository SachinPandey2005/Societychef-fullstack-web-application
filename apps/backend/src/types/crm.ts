export interface AuditLog {
  id: string;
  actor_id: string; // The admin/ops user who performed the action
  action: string; // e.g., 'SUSPEND_CHEF', 'APPROVE_REFUND'
  target_entity: string; // e.g., 'profile', 'refund_request'
  target_entity_id: string;
  previous_value?: any;
  new_value?: any;
  reason?: string;
  ip_address?: string;
  created_at?: string;
}

export type NoteEntityType = 'CUSTOMER' | 'CHEF' | 'ORDER' | 'PARTNER';

export interface AdminNote {
  id: string;
  entity_type: NoteEntityType;
  entity_id: string;
  author_id: string;
  note: string;
  created_at?: string;
  updated_at?: string;
}
