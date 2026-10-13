import { RbacRepository } from '../repositories/rbac.repository';
import { CrmRepository } from '../repositories/crm.repository';
import { logger } from '../utils/logger';

export class RbacService {
  static async getRoles() {
    return RbacRepository.getRoles();
  }

  static async getPermissions() {
    return RbacRepository.getPermissions();
  }

  static async getRolePermissions(role_id: string) {
    return RbacRepository.getRolePermissions(role_id);
  }

  static async createRole(name: string, description: string, admin_id: string) {
    const role = await RbacRepository.createRole({ name, description, is_system_role: false });
    
    await CrmRepository.createAuditLog({
      actor_id: admin_id,
      action: 'CREATE_ROLE',
      target_entity: 'roles',
      target_entity_id: role.id,
      new_value: role
    });
    return role;
  }

  static async updateRolePermissions(role_id: string, permission_ids: string[], admin_id: string) {
    await RbacRepository.setRolePermissions(role_id, permission_ids);
    
    await CrmRepository.createAuditLog({
      actor_id: admin_id,
      action: 'UPDATE_ROLE_PERMISSIONS',
      target_entity: 'roles',
      target_entity_id: role_id,
      new_value: permission_ids
    });
  }

  static async getUserPermissions(profile_id: string) {
    return RbacRepository.getUserPermissions(profile_id);
  }

  static async assignUserRole(profile_id: string, role_id: string, admin_id: string) {
    await RbacRepository.assignUserRole(profile_id, role_id);
    
    await CrmRepository.createAuditLog({
      actor_id: admin_id,
      action: 'ASSIGN_ROLE',
      target_entity: 'profiles',
      target_entity_id: profile_id,
      new_value: { role_id }
    });
  }
}
