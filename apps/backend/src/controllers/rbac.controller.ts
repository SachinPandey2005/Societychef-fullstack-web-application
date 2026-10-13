import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { RbacService } from '../services/rbac.service';
import { sendSuccess } from '../utils/response';
import { createRoleSchema, updateRolePermissionsSchema, assignRoleSchema } from '../validators/rbac.schema';

export const getRoles = asyncHandler(async (req: Request, res: Response) => {
  const roles = await RbacService.getRoles();
  sendSuccess(res, 'Roles retrieved', roles);
});

export const getPermissions = asyncHandler(async (req: Request, res: Response) => {
  const perms = await RbacService.getPermissions();
  sendSuccess(res, 'Permissions retrieved', perms);
});

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { body } = createRoleSchema.parse({ body: req.body });
  const role = await RbacService.createRole(body.name, body.description, admin_id);
  sendSuccess(res, 'Role created', role, 201);
});

export const getRolePermissions = asyncHandler(async (req: Request, res: Response) => {
  const perms = await RbacService.getRolePermissions(req.params.id as string);
  sendSuccess(res, 'Role permissions retrieved', perms);
});

export const updateRolePermissions = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { params, body } = updateRolePermissionsSchema.parse({ params: req.params, body: req.body });
  await RbacService.updateRolePermissions(params.id, body.permission_ids, admin_id);
  sendSuccess(res, 'Role permissions updated', null);
});

export const assignUserRole = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { body } = assignRoleSchema.parse({ body: req.body });
  await RbacService.assignUserRole(body.profile_id, body.role_id, admin_id);
  sendSuccess(res, 'User role assigned', null);
});

export const getUserPermissions = asyncHandler(async (req: Request, res: Response) => {
  const perms = await RbacService.getUserPermissions(req.params.profile_id as string);
  sendSuccess(res, 'User permissions retrieved', perms);
});
