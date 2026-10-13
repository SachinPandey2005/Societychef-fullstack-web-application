import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import {
  getPartnerProfile,
  updatePartnerProfile,
  uploadDocument,
  updateVehicleDetails,
  updateBankDetails,
  getKycStatus,
  uploadSelfie,
  getSocietyAssignment,
  submitKycVerification,
} from '../controllers/partner.controller';

const router = Router();
const partnerOnly = requireRole(['DELIVERY_PARTNER', 'SUPER_ADMIN']);

router.use(requireAuth);
router.use(partnerOnly);

router.get('/profile', getPartnerProfile);
router.put('/profile', updatePartnerProfile);
router.post('/documents', uploadDocument);
router.put('/vehicle', updateVehicleDetails);
router.put('/bank', updateBankDetails);
router.get('/kyc', getKycStatus);
router.post('/selfie', uploadSelfie);
router.get('/society', getSocietyAssignment);
router.post('/kyc/submit', submitKycVerification);

export default router;
