import { Router } from 'express';
import {
  createCashfreeOrder,
  verifyCashfreePayment,
  handleCashfreeWebhook,
  createOrder,
  verifyPayment,
  getPaymentHistory,
  getPaymentById,
  handleWebhook,
  renderCheckoutPage,
} from '../controllers/payment.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Unprotected Webhooks & Hosted pages
router.post('/webhook', handleWebhook); // Legacy Razorpay Webhook
router.post('/cashfree/webhook', handleCashfreeWebhook); // Cashfree Webhook
router.get('/checkout/:order_id', renderCheckoutPage); // Hosted Checkout HTML

// Protected Payment Endpoints
router.use(requireAuth);

// Cashfree Routes
router.post('/cashfree/create-order', createCashfreeOrder);
router.post('/cashfree/verify', verifyCashfreePayment);

// Common / Legacy Routes
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.get('/history', getPaymentHistory);
router.get('/:id', getPaymentById);

export default router;
