import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { searchCustomers, searchChefs, searchSocieties, searchDeliveryPartners, updateCustomerStatus, updateChefStatus, addAdminNote, updatePartnerStatus, assignPartnerSociety, updatePartnerKycStatus, getChefProfile, getCustomerProfile, resetUserPassword, sendNotification, updateProfile, updateKitchen } from '../controllers/crm.controller';
import { getTickets, createTicket, updateTicketStatus, addTicketMessage } from '../controllers/ticket.controller';
import { getComplaints, createComplaint, updateComplaintStatus } from '../controllers/complaint.controller';
import { getRefunds, createRefundRequest, processRefund } from '../controllers/refund.controller';
import { getPendingVerifications, updateVerificationStatus } from '../controllers/verification.controller';
import { getDashboardOverview } from '../controllers/dashboard.controller';

import dashboardRoutes from './dashboard.routes';

const router = Router();

// Protect ALL CRM routes
router.use(requireAuth);
// Base CRM access (At least Operations role or above)
router.use(requireRole(['OPERATIONS', 'SUPPORT_AGENT', 'FINANCE', 'KITCHEN_VERIFIER', 'admin', 'SUPER_ADMIN']));

// ----------------- Dashboard -----------------
router.get('/dashboard', getDashboardOverview);
router.use('/dashboard', dashboardRoutes);

// ----------------- CRM (Customers & Chefs & Partners) -----------------
router.get('/customers', searchCustomers);
router.get('/customers/:id', getCustomerProfile);
router.get('/chefs', searchChefs);
router.get('/chefs/:id', getChefProfile);
router.post('/profiles/:id/reset-password', resetUserPassword);
router.post('/send-notification', sendNotification);
router.patch('/profiles/:id', updateProfile);
router.patch('/kitchens/:id', updateKitchen);
router.get('/societies', requireRole(['OPERATIONS', 'SUPPORT_AGENT', 'FINANCE', 'KITCHEN_VERIFIER', 'admin', 'SUPER_ADMIN', 'DELIVERY_PARTNER']), searchSocieties);
import {
  getPartnerProfile,
  getPartnerOrders,
  getPartnerEarnings,
  getPartnerWallet,
  getPartnerSettlements,
  getPartnerNotifications,
  getPartnerDocuments,
  assignOrder,
  approveKyc,
  rejectKyc,
  suspendPartner,
  activatePartner,
  updatePartner,
  deletePartner
} from '../controllers/crm_partners.controller';

router.get('/delivery-partners', searchDeliveryPartners);
router.get('/delivery-partners/:id', getPartnerProfile);
router.get('/delivery-partners/:id/orders', getPartnerOrders);
router.get('/delivery-partners/:id/earnings', getPartnerEarnings);
router.get('/delivery-partners/:id/wallet', getPartnerWallet);
router.get('/delivery-partners/:id/settlements', getPartnerSettlements);
router.get('/delivery-partners/:id/notifications', getPartnerNotifications);
router.get('/delivery-partners/:id/documents', getPartnerDocuments);
router.post('/delivery-partners/:id/orders/assign', assignOrder);
router.post('/delivery-partners/:id/kyc/approve', approveKyc);
router.post('/delivery-partners/:id/kyc/reject', rejectKyc);
router.post('/delivery-partners/:id/suspend', suspendPartner);
router.post('/delivery-partners/:id/activate', activatePartner);
router.patch('/delivery-partners/:id', updatePartner);
router.delete('/delivery-partners/:id', deletePartner);

router.post('/delivery-partners/:id/society', assignPartnerSociety);
router.patch('/delivery-partners/:id/kyc', updatePartnerKycStatus);
router.patch('/customers/:id/status', updateCustomerStatus);
router.patch('/chefs/:id/status', updateChefStatus);
router.post('/notes', addAdminNote);

// ----------------- Orders -----------------
import {
  searchOrders,
  forceUpdateOrderStatus,
  getOrderFinancialDetails,
  updateOrderPaymentStatus,
  updateOrderSettlementStatus,
  getAuditLogs,
} from '../controllers/crm.controller';

router.get('/orders', searchOrders);
router.get('/orders/:id/financial-details', getOrderFinancialDetails);
router.patch('/orders/:id/status', forceUpdateOrderStatus);
router.patch('/orders/:id/payment-status', requireRole(['SUPER_ADMIN', 'admin', 'FINANCE', 'OPERATIONS']), updateOrderPaymentStatus);
router.patch('/orders/:id/settlement-status', requireRole(['SUPER_ADMIN', 'admin', 'FINANCE', 'OPERATIONS']), updateOrderSettlementStatus);

// ----------------- Audit Logs -----------------
router.get('/audit-logs', getAuditLogs);

// ----------------- Tickets -----------------
router.route('/tickets')
  .get(getTickets)
  .post(createTicket);
router.patch('/tickets/:id/status', updateTicketStatus);
router.post('/tickets/:id/messages', addTicketMessage);

// ----------------- Complaints -----------------
router.route('/complaints')
  .get(getComplaints)
  .post(createComplaint);
router.patch('/complaints/:id/status', updateComplaintStatus);

// ----------------- Refunds -----------------
router.route('/refunds')
  .get(getRefunds)
  .post(createRefundRequest);
// Restrict processing to Finance & Admins
router.patch('/refunds/:id/status', requireRole(['FINANCE', 'admin', 'SUPER_ADMIN']), processRefund);

// ----------------- Verification -----------------
router.get('/verification', getPendingVerifications);
// Restrict verification to Verifiers & Admins
router.patch('/verification/:id/status', requireRole(['KITCHEN_VERIFIER', 'admin', 'SUPER_ADMIN']), updateVerificationStatus);

export default router;
