export type CampaignTarget = 'ALL' | 'SOCIETY' | 'INACTIVE' | 'VIP' | 'CHEFS' | 'NEW_USERS';

export interface Campaign {
  id: string;
  name: string;
  type: 'PUSH' | 'BANNER' | 'COUPON' | 'REFERRAL';
  target_audience: CampaignTarget;
  target_id?: string; // e.g., society_id
  content: string; // Payload or message
  start_date: string;
  end_date?: string;
  is_active: boolean;
  metrics_sent: number;
  metrics_opened: number;
  metrics_converted: number;
  created_at?: string;
}
