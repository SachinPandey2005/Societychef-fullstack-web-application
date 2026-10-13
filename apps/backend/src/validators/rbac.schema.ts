import { z } from 'zod';

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string(),
    description: z.string()
  })
});

export const updateRolePermissionsSchema = z.object({
  params: z.object({
    id: z.string()
  }),
  body: z.object({
    permission_ids: z.array(z.string())
  })
});

export const assignRoleSchema = z.object({
  body: z.object({
    profile_id: z.string(),
    role_id: z.string()
  })
});
