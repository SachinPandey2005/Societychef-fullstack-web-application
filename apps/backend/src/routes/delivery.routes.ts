import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { registerPartner, toggleOnlineStatus, getAssignmentByOrder, updateAssignmentStatus, pushTrackingUpdate, getETA, getMySummary } from '../controllers/delivery.controller';

const router = Router();

router.use(requireAuth);

// Consumer/Chef tracking access
router.get('/orders/:orderId', getAssignmentByOrder);
router.get('/eta', getETA);

// Partner exclusive access
const partnerOnly = requireRole(['DELIVERY_PARTNER', 'SUPER_ADMIN']);
router.post('/register', partnerOnly, registerPartner);
router.get('/my-summary', partnerOnly, getMySummary);
router.patch('/status', partnerOnly, toggleOnlineStatus);
router.patch('/assignments/:id/status', partnerOnly, updateAssignmentStatus);
router.post('/assignments/:id/tracking', partnerOnly, pushTrackingUpdate);

export default router;
