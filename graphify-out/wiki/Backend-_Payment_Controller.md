# Backend: Payment Controller

> 21 nodes · cohesion 0.17

## Key Concepts

- **payment.controller.ts** (32 connections) — `apps/backend/src/controllers/payment.controller.ts`
- **payment.routes.ts** (15 connections) — `apps/backend/src/routes/payment.routes.ts`
- **payment.schema.ts** (7 connections) — `apps/backend/src/validators/payment.schema.ts`
- **handleWebhook** (6 connections) — `apps/backend/src/controllers/payment.controller.ts`
- **WebhookService** (6 connections) — `apps/backend/src/services/webhook.service.ts`
- **handleCashfreeWebhook** (5 connections) — `apps/backend/src/controllers/payment.controller.ts`
- **createCashfreeOrder** (4 connections) — `apps/backend/src/controllers/payment.controller.ts`
- **createOrder** (4 connections) — `apps/backend/src/controllers/payment.controller.ts`
- **getPaymentById** (4 connections) — `apps/backend/src/controllers/payment.controller.ts`
- **getPaymentHistory** (4 connections) — `apps/backend/src/controllers/payment.controller.ts`
- **verifyCashfreePayment** (4 connections) — `apps/backend/src/controllers/payment.controller.ts`
- **verifyPayment** (4 connections) — `apps/backend/src/controllers/payment.controller.ts`
- **renderCheckoutPage** (3 connections) — `apps/backend/src/controllers/payment.controller.ts`
- **.verifyWebhookSignature()** (2 connections) — `apps/backend/src/services/webhook.service.ts`
- **createCashfreeOrderSchema** (2 connections) — `apps/backend/src/validators/payment.schema.ts`
- **createRazorpayOrderSchema** (2 connections) — `apps/backend/src/validators/payment.schema.ts`
- **paymentIdSchema** (2 connections) — `apps/backend/src/validators/payment.schema.ts`
- **verifyCashfreePaymentSchema** (2 connections) — `apps/backend/src/validators/payment.schema.ts`
- **verifyPaymentSchema** (2 connections) — `apps/backend/src/validators/payment.schema.ts`
- **.dispatchEvent()** (1 connections) — `apps/backend/src/services/webhook.service.ts`
- **.signPayload()** (1 connections) — `apps/backend/src/services/webhook.service.ts`

## Relationships

- [Backend Middleware & Ownership Guards](Backend_Middleware_&_Ownership_Guards.md) (17 shared connections)
- [Backend CRM & Complaint Handlers](Backend_CRM_&_Complaint_Handlers.md) (10 shared connections)
- [Backend Routing & Health Controllers](Backend_Routing_&_Health_Controllers.md) (6 shared connections)
- [Backend: Device Controller](Backend-_Device_Controller.md) (4 shared connections)
- [Backend: Config Envschema](Backend-_Config_Envschema.md) (2 shared connections)
- [Backend: Controller Commission](Backend-_Controller_Commission.md) (2 shared connections)
- [Backend: Order Controller](Backend-_Order_Controller.md) (1 shared connections)

## Source Files

- `apps/backend/src/controllers/payment.controller.ts`
- `apps/backend/src/routes/payment.routes.ts`
- `apps/backend/src/services/webhook.service.ts`
- `apps/backend/src/validators/payment.schema.ts`

## Audit Trail

- EXTRACTED: 76 (99%)
- INFERRED: 1 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*