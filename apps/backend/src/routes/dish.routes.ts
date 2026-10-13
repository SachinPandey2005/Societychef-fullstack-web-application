import { Router } from 'express';
import { getDishes, getDish, getDiscoverFeed, createDish, updateDish, deleteDish, toggleDishAvailability, archiveDish } from '../controllers/dish.controller';
import { getDishAddons, createDishAddon, updateDishAddon, deleteDishAddon } from '../controllers/addon.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { requireDishOwnership } from '../middleware/ownership.middleware';

const router = Router();

// Must come before '/:id' or Express would try to treat "discover" as an id.
router.get('/discover', getDiscoverFeed);

router.route('/')
  .get(getDishes)
  // Any chef can create a dish; kitchen_id is in the payload, so ensure it matches their kitchen
  // For strict ownership on creation, we rely on the controller or service layer.
  // We'll protect creation to chef/admin.
  .post(requireAuth, requireRole(['chef', 'admin']), createDish);

router.route('/:id')
  .get(getDish)
  .put(requireAuth, requireRole(['chef', 'admin']), requireDishOwnership, updateDish)
  .delete(requireAuth, requireRole(['chef', 'admin']), requireDishOwnership, deleteDish);

router.patch('/:id/availability', requireAuth, requireRole(['chef', 'admin']), requireDishOwnership, toggleDishAvailability);
router.patch('/:id/archive', requireAuth, requireRole(['chef', 'admin']), requireDishOwnership, archiveDish);

// Chef-authored per-dish add-ons/customizations — see supabase/local/027_dish_addons.sql.
// Public read (a consumer must see them before placing an order); writes are
// chef-only and ownership-checked via the same requireDishOwnership used for
// the dish itself, since these routes also key off :id as the dish id.
router.get('/:id/addons', getDishAddons);
router.post('/:id/addons', requireAuth, requireRole(['chef', 'admin']), requireDishOwnership, createDishAddon);
router.put('/:id/addons/:addonId', requireAuth, requireRole(['chef', 'admin']), requireDishOwnership, updateDishAddon);
router.delete('/:id/addons/:addonId', requireAuth, requireRole(['chef', 'admin']), requireDishOwnership, deleteDishAddon);

export default router;
