import { Router } from 'express';
import { getProfiles, getProfile, createProfile, updateProfile, deleteProfile } from '../controllers/profile.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

// Generic profile CRUD, distinct from the self-service flow at /auth/profile
// (GET/PATCH, scoped to req.user!.id) and the curated admin flow at
// /crm/profiles/:id. This router had NO auth middleware at all: anyone could
// list every profile, read/overwrite/delete any profile by ID, or POST a new
// profile with role set directly to 'admin'/'SUPER_ADMIN'/'OPERATIONS' with no
// login whatsoever. Nothing in the app actually calls these routes (confirmed
// via a full-repo search), so they're locked to admin-tier staff only, same
// gate as the rest of the CRM surface.
router.use(requireAuth);
router.use(requireRole(['OPERATIONS', 'SUPPORT_AGENT', 'FINANCE', 'KITCHEN_VERIFIER', 'admin', 'SUPER_ADMIN']));

router.route('/')
  .get(getProfiles)
  .post(createProfile);

router.route('/:id')
  .get(getProfile)
  .put(updateProfile)
  .delete(deleteProfile);

export default router;
