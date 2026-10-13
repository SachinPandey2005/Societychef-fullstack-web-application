# Backend Middleware & Ownership Guards

> 70 nodes · cohesion 0.08

## Key Concepts

- **NotFoundError** (49 connections) — `apps/backend/src/utils/errors.ts`
- **ValidationError** (35 connections) — `apps/backend/src/utils/errors.ts`
- **order.service.ts** (32 connections) — `apps/backend/src/services/order.service.ts`
- **errors.ts** (30 connections) — `apps/backend/src/utils/errors.ts`
- **cashfree.service.ts** (28 connections) — `apps/backend/src/services/cashfree.service.ts`
- **OrderService** (23 connections) — `apps/backend/src/services/order.service.ts`
- **delivery.service.ts** (22 connections) — `apps/backend/src/services/delivery.service.ts`
- **settlement.service.ts** (20 connections) — `apps/backend/src/services/settlement.service.ts`
- **SettlementService** (20 connections) — `apps/backend/src/services/settlement.service.ts`
- **AuthorizationError** (20 connections) — `apps/backend/src/utils/errors.ts`
- **.updateOrderStatus()** (17 connections) — `apps/backend/src/services/order.service.ts`
- **ownership.middleware.ts** (16 connections) — `apps/backend/src/middleware/ownership.middleware.ts`
- **.getKitchenById()** (16 connections) — `apps/backend/src/services/kitchen.service.ts`
- **PaymentRepository** (15 connections) — `apps/backend/src/repositories/payment.repository.ts`
- **payment.service.ts** (15 connections) — `apps/backend/src/services/payment.service.ts`
- **dish.service.ts** (14 connections) — `apps/backend/src/services/dish.service.ts`
- **payment.repository.ts** (13 connections) — `apps/backend/src/repositories/payment.repository.ts`
- **cart.service.ts** (13 connections) — `apps/backend/src/services/cart.service.ts`
- **.verifyCashfreeOrder()** (11 connections) — `apps/backend/src/services/cashfree.service.ts`
- **webhook.service.ts** (11 connections) — `apps/backend/src/services/webhook.service.ts`
- **ref_crypto** (10 connections)
- **CashfreeService** (9 connections) — `apps/backend/src/services/cashfree.service.ts`
- **.handleWebhookEvent()** (9 connections) — `apps/backend/src/services/cashfree.service.ts`
- **.verifyPayment()** (9 connections) — `apps/backend/src/services/payment.service.ts`
- **Payment** (8 connections) — `apps/backend/src/types/payment.ts`
- *... and 45 more nodes in this community*

## Relationships

- [Financial Ledger & Refund Services](Financial_Ledger_&_Refund_Services.md) (27 shared connections)
- [Backend: Chat Controller](Backend-_Chat_Controller.md) (21 shared connections)
- [Backend: Config Envschema](Backend-_Config_Envschema.md) (21 shared connections)
- [Backend: Cart Repository](Backend-_Cart_Repository.md) (19 shared connections)
- [Backend: Payment Controller](Backend-_Payment_Controller.md) (17 shared connections)
- [Supabase Client & Auth Policies](Supabase_Client_&_Auth_Policies.md) (14 shared connections)
- [Backend: Kitchen Createkitchen](Backend-_Kitchen_Createkitchen.md) (13 shared connections)
- [Platform Compliance & Fraud Detection](Platform_Compliance_&_Fraud_Detection.md) (13 shared connections)
- [Campaigns & Coupon Engine](Campaigns_&_Coupon_Engine.md) (12 shared connections)
- [Backend: Dish Repository](Backend-_Dish_Repository.md) (10 shared connections)
- [Backend: Settlement Repository](Backend-_Settlement_Repository.md) (9 shared connections)
- [User Profiles & Admin Bootstrap](User_Profiles_&_Admin_Bootstrap.md) (9 shared connections)

## Source Files

- `apps/backend/src/controllers/order.controller.ts`
- `apps/backend/src/middleware/ownership.middleware.ts`
- `apps/backend/src/repositories/chat.repository.ts`
- `apps/backend/src/repositories/payment.repository.ts`
- `apps/backend/src/services/cart.service.ts`
- `apps/backend/src/services/cashfree.service.ts`
- `apps/backend/src/services/chat.service.ts`
- `apps/backend/src/services/crm.service.ts`
- `apps/backend/src/services/delivery.service.ts`
- `apps/backend/src/services/dish.service.ts`
- `apps/backend/src/services/kitchen.service.ts`
- `apps/backend/src/services/order.service.ts`
- `apps/backend/src/services/payment.service.ts`
- `apps/backend/src/services/settlement.service.ts`
- `apps/backend/src/services/webhook.service.ts`
- `apps/backend/src/types/payment.ts`
- `apps/backend/src/types/settlement.ts`
- `apps/backend/src/utils/errors.ts`

## Audit Trail

- EXTRACTED: 458 (99%)
- INFERRED: 3 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*