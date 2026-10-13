import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import {
  getPartnerDashboardOverview,
  getPartnerStatus,
  updatePartnerStatus,
  getPartnerShift,
  getPartnerPerformance,
  getNotifications,
  getAnnouncements,
} from '../controllers/partner_dashboard.controller';

const router = Router();
const partnerOnly = requireRole(['DELIVERY_PARTNER', 'SUPER_ADMIN']);

router.use(requireAuth);
router.use(partnerOnly);

// Module 18 API routes
router.get('/dashboard', getPartnerDashboardOverview);
router.get('/status', getPartnerStatus);
router.put('/status', updatePartnerStatus);
router.get('/shift', getPartnerShift);
router.get('/performance', getPartnerPerformance);
router.get('/notifications', getNotifications);
router.get('/announcements', getAnnouncements);

export default router;
