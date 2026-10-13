import { Router } from 'express';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import societyRoutes from './society.routes';
import kitchenRoutes from './kitchen.routes';
import dishRoutes from './dish.routes';
import cartRoutes from './cart.routes';
import orderRoutes from './order.routes';
import paymentRoutes from './payment.routes';
import notificationRoutes from './notification.routes';
import chatRoutes from './chat.routes';
import crmRoutes from './crm.routes';
import businessRoutes from './business.routes';
import deliveryRoutes from './delivery.routes';
import orderManagementRoutes from './order_management.routes';
import navigationTrackingRoutes from './navigation_tracking.routes';
import executionHandoverRoutes from './execution_handover.routes';
import walletFinanceRoutes from './wallet_finance.routes';
import partnerRoutes from './partner.routes';
import partnerDashboardRoutes from './partner_dashboard.routes';
import partnerPerformanceRoutes from './partner_performance.routes';
import supportRoutes from './support.routes';
import settingsSecurityRoutes from './settings_security.routes';
import recommendationRoutes from './recommendation.routes';
import inventoryRoutes from './inventory.routes';
import financeRoutes from './finance.routes';
import marketingRoutes from './marketing.routes';
import aiRoutes from './ai.routes';
import fraudRoutes from './fraud.routes';
import opsRoutes from './ops.routes';
import healthRoutes from './health.routes';
import complianceRoutes from './compliance.routes';
import securityAdminRoutes from './security_admin.routes';
import mobileRoutes from './mobile.routes';
import adminRoutes from './admin.routes';
import settingsRoutes from './settings.routes';
import rbacRoutes from './rbac.routes';
import analyticsRoutes from './analytics.routes';
import campaignRoutes from './campaign.routes';
import commissionRoutes from './commission.routes';
import settlementRoutes from './settlement.routes';
import refundRoutes from './refund.routes';
import dashboardRoutes from './dashboard.routes';
import automationRoutes from './automation.routes';
import partyRoutes from './party.routes';
import ticketRoutes from './ticket.routes';
import supplyRoutes from './supply.routes';
import mediaRoutes from './media.routes';
import weeklyDishRoutes from './weeklyDish.routes';
import reviewRoutes from './review.routes';
import { requireReplayProtection } from '../middleware/api_security.middleware';
import { requireSystemOnline } from '../middleware/maintenance.middleware';

const router = Router();

// Apply replay protection globally, but skip it for non-production environments and webhooks
router.use((req, res, next) => {
  const env = String(process.env.NODE_ENV || 'development');
  if (env !== 'production' || req.path.startsWith('/webhooks')) {
    return next();
  }
  return requireReplayProtection(req, res, next);
});

// Maintenance Mode Firewall (Bypass via header for now if unauthenticated)
router.use(requireSystemOnline);

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/profiles', profileRoutes);
router.use('/societies', societyRoutes);
router.use('/kitchens', kitchenRoutes);
router.use('/menu', dishRoutes);
router.use('/dishes', dishRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/chat', chatRoutes);
router.use('/crm', crmRoutes);
router.use('/business', businessRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/delivery', orderManagementRoutes);
router.use('/delivery', executionHandoverRoutes);
router.use('/', navigationTrackingRoutes);
router.use('/', walletFinanceRoutes);
router.use('/partner', partnerRoutes);
router.use('/partner', partnerDashboardRoutes);
router.use('/partner', partnerPerformanceRoutes);
router.use('/', supportRoutes);
router.use('/', settingsSecurityRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/finance', financeRoutes);
router.use('/commission', commissionRoutes);
router.use('/settlements', settlementRoutes);
router.use('/refunds', refundRoutes);
router.use('/adjustments', refundRoutes);
router.use('/disputes', refundRoutes);
router.use('/finance-automation', automationRoutes);
router.use('/marketing', marketingRoutes);

router.use('/party', partyRoutes);
router.use('/tickets', ticketRoutes);
router.use('/supplies', supplyRoutes);
router.use('/media', mediaRoutes);
router.use('/weekly-dishes', weeklyDishRoutes);
router.use('/reviews', reviewRoutes);
router.use('/ai', aiRoutes);
router.use('/fraud', fraudRoutes);
router.use('/ops', opsRoutes);
router.use('/settings', settingsRoutes);
router.use('/rbac', rbacRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/campaigns', campaignRoutes);
import biRoutes from './bi.routes';
import developerRoutes from './developer.routes';
import publicV1Routes from './public/v1/index';
import privacyRoutes from './privacy.routes';
import governanceRoutes from './governance.routes';
import platformRoutes from './platform.routes';
import executiveRoutes from './executive.routes';
import launchRoutes from './launch.routes';
import { resolveTenantContext } from '../middleware/tenant.middleware';

// Apply Multi-Tenant Extractor globally
router.use(resolveTenantContext);

router.use('/mobile', mobileRoutes);
router.use('/admin', adminRoutes);
router.use('/bi', biRoutes);
router.use('/developer', developerRoutes);
router.use('/v1', publicV1Routes);
router.use('/privacy', privacyRoutes);
router.use('/governance', governanceRoutes);
router.use('/platform', platformRoutes);
router.use('/executive', executiveRoutes);
router.use('/launch', launchRoutes);

export default router;
