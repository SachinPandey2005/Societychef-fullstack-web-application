import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { roles, permissions, rolePermissions, userRoles } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase, toCamelCaseInput } from '../db/caseMapper';
import { RoleDefinition, Permission } from '../types/rbac';

// roles/permissions/role_permissions/user_roles never existed (confirmed
// absent from the live schema dump) despite being live-routed under /rbac.
// This is a separate, more granular layer from the profiles.role text
// column that requireRole/authorize actually enforce elsewhere —
// requirePermission (the middleware for this layer) isn't wired into any
// business route yet, but the /rbac admin endpoints for managing roles and
// permissions are live. Created via supabase/local/016_rbac_tables.sql.
export class RbacRepository {
  static async getRoles(): Promise<RoleDefinition[]> {
    const rows = await db.select().from(roles);
    return rowsToSnakeCase<RoleDefinition>(rows);
  }

  static async getPermissions(): Promise<Permission[]> {
    const rows = await db.select().from(permissions);
    return rowsToSnakeCase<Permission>(rows);
  }

  static async getRolePermissions(role_id: string): Promise<string[]> {
    const rows = await db.select({ permissionId: rolePermissions.permissionId }).from(rolePermissions).where(eq(rolePermissions.roleId, role_id));
    return rows.map((r) => r.permissionId);
  }

  static async createRole(role: Omit<RoleDefinition, 'id' | 'created_at' | 'updated_at'>): Promise<RoleDefinition> {
    const rows = await db.insert(roles).values(toCamelCaseInput(role) as any).returning();
    return rowToSnakeCase<RoleDefinition>(rows[0]);
  }

  static async setRolePermissions(role_id: string, permission_ids: string[]): Promise<void> {
    // Clean old permissions
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, role_id));

    // Insert new
    if (permission_ids.length > 0) {
      await db.insert(rolePermissions).values(permission_ids.map((pid) => ({ roleId: role_id, permissionId: pid })));
    }
  }

  static async getUserPermissions(profile_id: string): Promise<string[]> {
    const rows = await db
      .select({ permissionId: rolePermissions.permissionId })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
      .where(eq(userRoles.profileId, profile_id));

    return Array.from(new Set(rows.map((r) => r.permissionId)));
  }

  static async assignUserRole(profile_id: string, role_id: string): Promise<void> {
    await db.insert(userRoles).values({ profileId: profile_id, roleId: role_id });
  }

  static async removeUserRole(profile_id: string, role_id: string): Promise<void> {
    await db.delete(userRoles).where(and(eq(userRoles.profileId, profile_id), eq(userRoles.roleId, role_id)));
  }
}
