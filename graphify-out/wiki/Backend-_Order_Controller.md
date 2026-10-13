# Backend: Order Controller

> 27 nodes · cohesion 0.11

## Key Concepts

- **zod** (40 connections) — `apps/backend/package.json`
- **partner.controller.ts** (23 connections) — `apps/backend/src/controllers/partner.controller.ts`
- **order.controller.ts** (19 connections) — `apps/backend/src/controllers/order.controller.ts`
- **order.routes.ts** (14 connections) — `apps/backend/src/routes/order.routes.ts`
- **.uploadDocument()** (7 connections) — `apps/backend/src/services/partner.service.ts`
- **partner.schema.ts** (6 connections) — `apps/backend/src/validators/partner.schema.ts`
- **order.schema.ts** (5 connections) — `apps/backend/src/validators/order.schema.ts`
- **checkout** (4 connections) — `apps/backend/src/controllers/order.controller.ts`
- **getOrder** (4 connections) — `apps/backend/src/controllers/order.controller.ts`
- **updateOrderStatus** (4 connections) — `apps/backend/src/controllers/order.controller.ts`
- **uploadDocument** (4 connections) — `apps/backend/src/controllers/partner.controller.ts`
- **uploadSelfie** (4 connections) — `apps/backend/src/controllers/partner.controller.ts`
- **refund.schema.ts** (3 connections) — `apps/backend/src/validators/refund.schema.ts`
- **settlement.schema.ts** (3 connections) — `apps/backend/src/validators/settlement.schema.ts`
- **.upsertDocument()** (2 connections) — `apps/backend/src/repositories/partner.repository.ts`
- **router** (2 connections) — `apps/backend/src/routes/order.routes.ts`
- **checkoutSchema** (2 connections) — `apps/backend/src/validators/order.schema.ts`
- **orderIdSchema** (2 connections) — `apps/backend/src/validators/order.schema.ts`
- **orderStatusTransitionSchema** (2 connections) — `apps/backend/src/validators/order.schema.ts`
- **updateBankSchema** (2 connections) — `apps/backend/src/validators/partner.schema.ts`
- **updatePartnerProfileSchema** (2 connections) — `apps/backend/src/validators/partner.schema.ts`
- **updateVehicleSchema** (2 connections) — `apps/backend/src/validators/partner.schema.ts`
- **uploadDocumentSchema** (2 connections) — `apps/backend/src/validators/partner.schema.ts`
- **createRefundRequestSchema** (1 connections) — `apps/backend/src/validators/refund.schema.ts`
- **processRefundSchema** (1 connections) — `apps/backend/src/validators/refund.schema.ts`
- *... and 2 more nodes in this community*

## Relationships

- [Backend CRM & Complaint Handlers](Backend_CRM_&_Complaint_Handlers.md) (15 shared connections)
- [Supabase Client & Auth Policies](Supabase_Client_&_Auth_Policies.md) (14 shared connections)
- [Backend Routing & Health Controllers](Backend_Routing_&_Health_Controllers.md) (10 shared connections)
- [Backend Middleware & Ownership Guards](Backend_Middleware_&_Ownership_Guards.md) (8 shared connections)
- [Backend: Controller Commission](Backend-_Controller_Commission.md) (6 shared connections)
- [Campaigns & Coupon Engine](Campaigns_&_Coupon_Engine.md) (3 shared connections)
- [Backend: Kitchen Createkitchen](Backend-_Kitchen_Createkitchen.md) (2 shared connections)
- [Backend: Service Idempotency](Backend-_Service_Idempotency.md) (2 shared connections)
- [Backend: Delivery Controller](Backend-_Delivery_Controller.md) (2 shared connections)
- [Backend: Dish Controller](Backend-_Dish_Controller.md) (2 shared connections)
- [Backend: Deletekitchen Kitchen](Backend-_Deletekitchen_Kitchen.md) (2 shared connections)
- [Backend: Cart Repository](Backend-_Cart_Repository.md) (1 shared connections)

## Source Files

- `apps/backend/package.json`
- `apps/backend/src/controllers/order.controller.ts`
- `apps/backend/src/controllers/partner.controller.ts`
- `apps/backend/src/repositories/partner.repository.ts`
- `apps/backend/src/routes/order.routes.ts`
- `apps/backend/src/services/partner.service.ts`
- `apps/backend/src/validators/order.schema.ts`
- `apps/backend/src/validators/partner.schema.ts`
- `apps/backend/src/validators/refund.schema.ts`
- `apps/backend/src/validators/settlement.schema.ts`

## Audit Trail

- EXTRACTED: 120 (98%)
- INFERRED: 3 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*