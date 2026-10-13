import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { PaymentService } from '../services/payment.service';
import { CashfreeService } from '../services/cashfree.service';
import { WebhookService } from '../services/webhook.service';
import { PaymentRepository } from '../repositories/payment.repository';
import { sendSuccess, sendError } from '../utils/response';
import {
  createRazorpayOrderSchema,
  verifyPaymentSchema,
  paymentIdSchema,
  createCashfreeOrderSchema,
  verifyCashfreePaymentSchema
} from '../validators/payment.schema';
import { env } from '../config/env';

// ─── Cashfree Payment Controller Endpoints ────────────────────────────────────

export const createCashfreeOrder = asyncHandler(async (req: Request, res: Response) => {
  const consumer_id = req.user!.id;
  const { body } = createCashfreeOrderSchema.parse({ body: req.body });

  // body.amount is intentionally ignored — see cashfree.service.ts, the
  // charged amount is always computed server-side from the real order(s).
  const paymentData = await CashfreeService.createCashfreeOrder(consumer_id, body.order_id, {
    name: body.customer_name,
    phone: body.customer_phone,
    email: body.customer_email,
    associated_order_ids: body.associated_order_ids,
  });

  sendSuccess(res, 'Cashfree order created successfully', paymentData, 201);
});

export const verifyCashfreePayment = asyncHandler(async (req: Request, res: Response) => {
  const consumer_id = req.user!.id;
  const { body } = verifyCashfreePaymentSchema.parse({ body: req.body });

  const verificationResult = await CashfreeService.verifyCashfreeOrder(
    consumer_id,
    body.order_id,
    body.cf_order_id
  );

  sendSuccess(res, 'Cashfree payment verified', verificationResult);
});

export const handleCashfreeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-webhook-signature'] as string;
  const timestamp = req.headers['x-webhook-timestamp'] as string;

  if (!signature || !timestamp) {
    return sendError(res, 'Missing Cashfree webhook signature or timestamp header', null, 400);
  }

  const rawBody = (req as any).rawBody
    ? (req as any).rawBody.toString('utf8')
    : JSON.stringify(req.body);

  const result = await CashfreeService.handleWebhookEvent(rawBody, signature, timestamp);
  sendSuccess(res, 'Cashfree webhook processed successfully', result, 200);
});

// ─── Legacy / Common Controller Endpoints ─────────────────────────────────────

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const consumer_id = req.user!.id;
  const { body } = createRazorpayOrderSchema.parse({ body: req.body });
  
  const paymentMetadata = await PaymentService.createRazorpayOrder(consumer_id, body.order_id);
  sendSuccess(res, 'Razorpay order created successfully', paymentMetadata, 201);
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const consumer_id = req.user!.id;
  const { body } = verifyPaymentSchema.parse({ body: req.body });
  
  const payment = await PaymentService.verifyPayment(
    consumer_id,
    body.razorpay_order_id,
    body.razorpay_payment_id,
    body.razorpay_signature
  );
  
  sendSuccess(res, 'Payment verified successfully', payment);
});

export const getPaymentHistory = asyncHandler(async (req: Request, res: Response) => {
  const consumer_id = req.user!.id;
  const history = await PaymentService.getTransactionHistory(consumer_id);
  sendSuccess(res, 'Payment history retrieved', history);
});

export const getPaymentById = asyncHandler(async (req: Request, res: Response) => {
  const consumer_id = req.user!.id;
  const { params } = paymentIdSchema.parse({ params: req.params });
  
  const pay = await PaymentRepository.findById(params.id);

  if (!pay) {
    return sendError(res, 'Payment not found', null, 404);
  }

  // Ownership guard
  if (pay.consumer_id !== consumer_id && req.user!.role !== 'admin') {
    return sendError(res, 'Unauthorized', null, 403);
  }

  sendSuccess(res, 'Payment retrieved', pay);
});

export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  
  if (!signature) {
    return sendError(res, 'Missing webhook signature', null, 400);
  }

  // The payload must be the raw body string for Razorpay to verify correctly.
  const payload = (req as any).rawBody 
    ? (req as any).rawBody.toString('utf8') 
    : JSON.stringify(req.body);

  const isValid = WebhookService.verifyWebhookSignature(payload, signature);
  if (!isValid) {
    return sendError(res, 'Invalid signature', null, 400);
  }

  await WebhookService.handleEvent(req.body);
  
  // Respond quickly to acknowledge receipt
  sendSuccess(res, 'Webhook received', null, 200);
});

export const renderCheckoutPage = asyncHandler(async (req: Request, res: Response) => {
  const order_id = req.params.order_id as string;
  if (!order_id) {
    return res.status(400).send('Missing order_id');
  }
  
  const payment = await PaymentRepository.findByInternalOrderId(order_id);
  if (!payment || payment.length === 0) {
    return res.status(404).send('Payment not found for this order.');
  }

  const p = payment[0];
  if (p.payment_status === 'CAPTURED') {
    return res.status(400).send('Order already paid.');
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Secure Checkout</title>
      <style>
        body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background-color: #f7f9fa; }
        .card { background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; }
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #F15223; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div class="card" id="loading">
        <div class="spinner"></div>
        <p>Loading secure payment gateway...</p>
      </div>

      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      <script>
        var options = {
          "key": "${env.RAZORPAY_KEY_ID}",
          "amount": "${p.amount}",
          "currency": "${p.currency}",
          "name": "RasoHi",
          "description": "Order #${order_id}",
          "order_id": "${p.razorpay_order_id}",
          "theme": {
            "color": "#F15223"
          },
          "handler": function (response) {
            // Redirect back to app on success
            window.location.href = "rasohi://payment-success?razorpay_payment_id=" + response.razorpay_payment_id +
                                   "&razorpay_order_id=" + response.razorpay_order_id +
                                   "&razorpay_signature=" + response.razorpay_signature;
          },
          "modal": {
            "ondismiss": function() {
              window.location.href = "rasohi://payment-cancelled";
            }
          }
        };
        var rzp = new Razorpay(options);

        rzp.on('payment.failed', function (response){
          window.location.href = "rasohi://payment-failed?error=" + encodeURIComponent(response.error.description);
        });

        // Hide loading UI and open immediately
        document.getElementById('loading').style.display = 'none';
        rzp.open();
      </script>
    </body>
    </html>
  `;
  
  res.send(html);
});
