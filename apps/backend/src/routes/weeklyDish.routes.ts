import { Router } from 'express';
import {
  getWeeklyDish,
  getWeeklyDishes,
  createWeeklyDish,
  updateWeeklyDish,
  deleteWeeklyDish,
} from '../controllers/weeklyDish.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { requireWeeklyDishOwnership } from '../middleware/ownership.middleware';

const router = Router();

// Must come before '/:id' or Express would try to treat "" (list) as an id —
// kept distinct paths anyway since list takes query params, not a param.
router.get('/', getWeeklyDishes);
router.post('/', requireAuth, requireRole(['chef', 'admin']), createWeeklyDish);

router.get('/:id', getWeeklyDish);
router.put('/:id', requireAuth, requireRole(['chef', 'admin']), requireWeeklyDishOwnership, updateWeeklyDish);
router.delete('/:id', requireAuth, requireRole(['chef', 'admin']), requireWeeklyDishOwnership, deleteWeeklyDish);

export default router;
