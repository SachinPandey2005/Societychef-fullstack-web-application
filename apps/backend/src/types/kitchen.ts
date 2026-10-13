export type KitchenStatus = 'active' | 'inactive' | 'suspended';

export interface KitchenMedia {
  url: string;
  type: 'image' | 'video';
}

export interface OperatingHours {
  open: string; // HH:mm
  close: string; // HH:mm
  days: string[]; // e.g., ['Monday', 'Tuesday']
}

export interface Kitchen {
  id: string;
  chef_user_id: string; // References profiles.id
  name: string;
  chef_name: string;
  address?: string;
  society_id?: string;
  tower?: string;
  flat?: string;
  hide_identity: boolean;
  default_lead_time_minutes: number;
  bank_status: string;
  hygiene_status: string;
  is_verified: boolean;
  is_top_rated: boolean;
  is_live: boolean;
  cover_image?: string;
  profile_image?: string;
  story_prompts?: any;
  hygiene_details?: any;
  trust_badges?: any;
  kitchen_info?: any;
  stats?: any;
  created_at?: string;
  updated_at?: string;
}

export type CreateKitchenInput = Omit<Kitchen, 'id' | 'hygiene_score' | 'created_at' | 'updated_at'>;
export type UpdateKitchenInput = Partial<CreateKitchenInput>;
