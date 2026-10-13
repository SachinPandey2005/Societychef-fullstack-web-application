import { Router } from 'express';
import { getKitchens, getKitchen, getMyKitchen, getKitchenStats, createKitchen, updateKitchen, deleteKitchen, updateKitchenStatus, uploadChefDocument } from '../controllers/kitchen.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { requireKitchenOwnership } from '../middleware/ownership.middleware';
import { uploadMedia } from '../middleware/upload.middleware';

const router = Router();

router.route('/')
  .get(getKitchens)
  // No role gate: this is also the self-service "become a chef" registration
  // path (chef-register.tsx) — a 'consumer' has no kitchen yet, so a
  // chef/admin-only gate would reject the exact request that's supposed to
  // make them one. createKitchen already forces chef_user_id to the caller's
  // own id for non-admins, so this can't create a kitchen owned by anyone else.
  .post(requireAuth, createKitchen);

// Must come before '/:id' or Express would try to treat "stats"/"me" as an id.
router.get('/stats', getKitchenStats);
router.get('/me', requireAuth, getMyKitchen);

router.route('/:id')
  .get(getKitchen)
  .put(requireAuth, requireRole(['chef', 'admin']), requireKitchenOwnership, updateKitchen)
  .delete(requireAuth, requireRole(['chef', 'admin']), requireKitchenOwnership, deleteKitchen);

router.patch('/:id/status', requireAuth, requireRole(['chef', 'admin']), requireKitchenOwnership, updateKitchenStatus);
// Kitchen gallery photos/videos go through PUT /:id (kitchens.gallery/videos
// array columns, already Drizzle-backed) + the chef-photos upload path
// instead — removed dead POST/PUT/DELETE /:id/media endpoints here, which
// wrote to a Supabase-only kitchen_media table nothing in the mobile app
// ever actually called.
router.post('/:id/documents', requireAuth, requireRole(['chef', 'admin']), requireKitchenOwnership, uploadMedia.single('file'), uploadChefDocument);

export default router;
