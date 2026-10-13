import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { getRoles, getPermissions, createRole, getRolePermissions, updateRolePermissions, assignUserRole, getUserPermissions } from '../controllers/rbac.controller';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['SUPER_ADMIN', 'admin'])); // Only admins manage RBAC

router.route('/roles')
  .get(getRoles)
  .post(createRole);

router.route('/roles/:id/permissions')
  .get(getRolePermissions)
  .put(updateRolePermissions);

router.get('/permissions', getPermissions);

router.route('/user-roles')
  .post(assignUserRole);

router.get('/users/:profile_id/permissions', getUserPermissions);

export default router;
