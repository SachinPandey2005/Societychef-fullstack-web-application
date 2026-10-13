import { Router } from 'express';
import { checkout, createDirectOrder, getOrder, updateOrderStatus, getOrderHistory } from '../controllers/order.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireOrderOwnership } from '../middleware/ownership.middleware';
import { requireIdempotency } from '../middleware/idempotency.middleware';

const router = Router();

router.use(requireAuth);

router.post('/', requireIdempotency, checkout);
router.post('/direct', requireIdempotency, createDirectOrder);
router.get('/history', getOrderHistory);

router.route('/:id')
  .get(requireOrderOwnership, getOrder);

router.patch('/:id/status', requireOrderOwnership, updateOrderStatus);

export default router;
