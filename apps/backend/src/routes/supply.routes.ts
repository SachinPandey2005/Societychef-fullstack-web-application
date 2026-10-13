import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { getSupplyItems, createSupplyOrder, getMySupplyOrders } from '../controllers/supply.controller';

const router = Router();

router.use(requireAuth);

router.get('/', getSupplyItems);

const chefOnly = requireRole(['chef', 'admin']);
router.post('/orders', chefOnly, createSupplyOrder);
router.get('/orders', chefOnly, getMySupplyOrders);

export default router;
