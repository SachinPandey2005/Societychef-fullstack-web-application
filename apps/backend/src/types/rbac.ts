export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  is_system_role: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  description: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

export interface UserRole {
  profile_id: string;
  role_id: string;
}
