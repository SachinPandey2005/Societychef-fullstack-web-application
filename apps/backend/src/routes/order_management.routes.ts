import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import {
  getOrdersList,
  getOrderDetails,
  acceptOrder,
  rejectOrder,
  updateOrderStatus,
  getOrderHistory,
} from '../controllers/order_management.controller';

const router = Router();
const partnerOnly = requireRole(['DELIVERY_PARTNER', 'SUPER_ADMIN']);

router.use(requireAuth);
router.use(partnerOnly);

// Module 17 Order Management endpoints
router.get('/orders', getOrdersList);
router.get('/orders/:id', getOrderDetails);
router.put('/orders/:id/accept', acceptOrder);
router.put('/orders/:id/reject', rejectOrder);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/history', getOrderHistory);

export default router;
