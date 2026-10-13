export type Role = 'consumer' | 'chef' | 'admin' | 'SUPER_ADMIN' | 'OPERATIONS' | 'SUPPORT_AGENT' | 'FINANCE' | 'KITCHEN_VERIFIER' | 'DELIVERY_PARTNER' | 'MARKETING_MANAGER';

export interface Profile {
  id: string;
  phone: string;
  name: string;
  display_name?: string;
  society?: string;
  role: Role;
  roles?: string[];
  active_role?: string;
  chef_profile_id?: string;
  flat?: string;
  status?: string;
  email?: string;
  avatar_url?: string;
  cover_image?: string;
  society_id?: string;
  notification_preferences?: any;
  created_at?: string;
  updated_at?: string;
  password_hash?: string;
}

export type CreateProfileInput = Omit<Profile, 'created_at' | 'updated_at'>;
export type UpdateProfileInput = Partial<CreateProfileInput>;
