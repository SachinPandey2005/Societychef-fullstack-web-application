import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import {
  confirmPickup,
  verifyChefPin,
  verifyCustomerOtp,
  submitProofOfDelivery,
  completeDelivery,
  reportIssue,
  getDeliveryStatus,
} from '../controllers/execution_handover.controller';

const router = Router();
const partnerOnly = requireRole(['DELIVERY_PARTNER', 'SUPER_ADMIN']);

router.use(requireAuth);
router.use(partnerOnly);

// Handover Execution Endpoints
router.post('/pickup', confirmPickup);
router.post('/pickup/verify', verifyChefPin);
router.post('/otp/verify', verifyCustomerOtp);
router.post('/proof', submitProofOfDelivery);
router.post('/complete', completeDelivery);
router.post('/issue', reportIssue);
router.get('/status', getDeliveryStatus);

export default router;
