export interface MarketingPreference {
  id: string; // Same as profile_id
  email_opt_in: boolean;
  sms_opt_in: boolean;
  push_opt_in: boolean;
  promotions_opt_in: boolean;
  created_at?: string;
  updated_at?: string;
}

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  target_segment?: string; // Query or explicit ID
  channel: 'PUSH' | 'IN_APP' | 'EMAIL' | 'SMS';
  content_template: string;
  status: CampaignStatus;
  scheduled_at?: string;
  created_at?: string;
}

export interface CustomerEngagement {
  id: string;
  profile_id: string;
  campaign_id: string;
  status: 'SENT' | 'DELIVERED' | 'OPENED' | 'CONVERTED';
  converted_order_id?: string;
  created_at?: string;
}

export interface CustomerSegment {
  id: string;
  name: string;
  rules: Record<string, any>; // Dynamic rules, e.g., { spend_gt: 1000 }
  created_at?: string;
}
