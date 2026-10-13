import type { AuthUser, Role, UserRights } from '../types';

// ── Default Role Permissions Matrix (RBAC) ──────────────────────────────────
export const DEFAULT_ROLE_RIGHTS: Record<Role, UserRights> = {
  admin: {
    // Consumer Rights (Read-only / Audit)
    canBrowseDishes: true,
    canPlaceOrders: false,
    canBookPartyEvents: false,
    canRateAndReview: false,
    canEarnRewards: false,

    // Chef Rights (Audit / Override)
    canManageKitchenProfile: true,
    canPublishDishes: true,
    canFulfillOrders: true,
    canViewChefEarnings: true,
    canOrderSupplies: true,

    // Admin / CRM Rights (Full Platform Controls)
    canAccessCRM: true,
    canApproveChefs: true,
    canOverrideOrders: true,
    canAuditFinance: true,
    canManagePlatformUsers: true,
  },
  ops: {
    canBrowseDishes: true,
    canPlaceOrders: false,
    canBookPartyEvents: false,
    canRateAndReview: false,
    canEarnRewards: false,

    canManageKitchenProfile: true,
    canPublishDishes: true,
    canFulfillOrders: true,
    canViewChefEarnings: true,
    canOrderSupplies: true,

    canAccessCRM: true,
    canApproveChefs: true,
    canOverrideOrders: true,
    canAuditFinance: true,
    canManagePlatformUsers: false,
  },
  chef: {
    canBrowseDishes: true,
    canPlaceOrders: false,
    canBookPartyEvents: false,
    canRateAndReview: false,
    canEarnRewards: false,

    // Chef Portal Rights
    canManageKitchenProfile: true,
    canPublishDishes: true,
    canFulfillOrders: true,
    canViewChefEarnings: true,
    canOrderSupplies: true,

    // Admin / CRM Rights
    canAccessCRM: false,
    canApproveChefs: false,
    canOverrideOrders: false,
    canAuditFinance: false,
    canManagePlatformUsers: false,
  },
  consumer: {
    // Consumer Portal Rights
    canBrowseDishes: true,
    canPlaceOrders: true,
    canBookPartyEvents: true,
    canRateAndReview: true,
    canEarnRewards: true,

    // Chef Rights
    canManageKitchenProfile: false,
    canPublishDishes: false,
    canFulfillOrders: false,
    canViewChefEarnings: false,
    canOrderSupplies: false,

    // Admin / CRM Rights
    canAccessCRM: false,
    canApproveChefs: false,
    canOverrideOrders: false,
    canAuditFinance: false,
    canManagePlatformUsers: false,
  },
};

// ── 1. Admin / CRM User Object ───────────────────────────────────────────────
export const ADMIN_USER: AuthUser = {
  id: 'USR-ADMIN-001',
  phone: '+919999900000',
  email: 'admin@rasohi.com',
  displayName: 'Platform Admin (CRM)',
  role: 'admin',
  roles: ['admin', 'ops'],
  activeRole: 'admin',
  society: 'Global HQ',
  societyId: 'soc_global',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
  rights: DEFAULT_ROLE_RIGHTS.admin,
};

// ── 2. Chef User Object ──────────────────────────────────────────────────────
export const CHEF_USER: AuthUser = {
  id: 'USR-CHEF-101',
  phone: '+919876543210',
  email: 'chef.kavita@rasohi.com',
  displayName: 'Chef Kavita Sharma',
  role: 'chef',
  roles: ['chef', 'consumer'],
  activeRole: 'chef',
  chefProfileId: 'kavita',
  society: 'Lotus Heights',
  societyId: 'soc_lotus',
  flat: 'B-302',
  tower: 'Tower B',
  address: 'B-302, Lotus Heights',
  profileImage: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=200&q=80',
  avatarUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=200&q=80',
  rights: DEFAULT_ROLE_RIGHTS.chef,
};

// ── 3. Consumer User Object ──────────────────────────────────────────────────
export const CONSUMER_USER: AuthUser = {
  id: 'USR-CONS-501',
  phone: '+919123456789',
  email: 'sakshi.consumer@rasohi.com',
  displayName: 'Sakshi (Resident)',
  role: 'consumer',
  roles: ['consumer'],
  activeRole: 'consumer',
  society: 'Lotus Heights',
  societyId: 'soc_lotus',
  flat: 'A-801',
  tower: 'Tower A',
  address: 'A-801, Lotus Heights',
  avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
  rights: DEFAULT_ROLE_RIGHTS.consumer,
};

// Map of all system user objects
export const SYSTEM_USERS: Record<string, AuthUser> = {
  admin: ADMIN_USER,
  chef: CHEF_USER,
  consumer: CONSUMER_USER,
};

// Helper function to check granular rights
export function hasRight(user: AuthUser | null, rightKey: keyof UserRights): boolean {
  if (!user) return false;
  if (user.rights && rightKey in user.rights) {
    return user.rights[rightKey];
  }
  return DEFAULT_ROLE_RIGHTS[user.role]?.[rightKey] ?? false;
}
