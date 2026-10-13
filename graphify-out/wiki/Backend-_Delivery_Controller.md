# Backend: Delivery Controller

> 15 nodes · cohesion 0.21

## Key Concepts

- **delivery.controller.ts** (24 connections) — `apps/backend/src/controllers/delivery.controller.ts`
- **delivery.routes.ts** (15 connections) — `apps/backend/src/routes/delivery.routes.ts`
- **delivery.schema.ts** (6 connections) — `apps/backend/src/validators/delivery.schema.ts`
- **getETA** (4 connections) — `apps/backend/src/controllers/delivery.controller.ts`
- **pushTrackingUpdate** (4 connections) — `apps/backend/src/controllers/delivery.controller.ts`
- **getAssignmentByOrder** (3 connections) — `apps/backend/src/controllers/delivery.controller.ts`
- **registerPartner** (3 connections) — `apps/backend/src/controllers/delivery.controller.ts`
- **.pushTracking()** (3 connections) — `apps/backend/src/services/delivery.service.ts`
- **router** (2 connections) — `apps/backend/src/routes/delivery.routes.ts`
- **.calculateETA()** (2 connections) — `apps/backend/src/services/delivery.service.ts`
- **pushTrackingSchema** (2 connections) — `apps/backend/src/validators/delivery.schema.ts`
- **registerPartnerSchema** (2 connections) — `apps/backend/src/validators/delivery.schema.ts`
- **updateDeliveryStatusSchema** (2 connections) — `apps/backend/src/validators/delivery.schema.ts`
- **updatePartnerStatusSchema** (2 connections) — `apps/backend/src/validators/delivery.schema.ts`
- **partnerOnly** (1 connections) — `apps/backend/src/routes/delivery.routes.ts`

## Relationships

- [Backend Routing & Health Controllers](Backend_Routing_&_Health_Controllers.md) (8 shared connections)
- [Backend CRM & Complaint Handlers](Backend_CRM_&_Complaint_Handlers.md) (6 shared connections)
- [Backend: Updateassignmentstatus Deliveryservice](Backend-_Updateassignmentstatus_Deliveryservice.md) (5 shared connections)
- [Supabase Client & Auth Policies](Supabase_Client_&_Auth_Policies.md) (4 shared connections)
- [Backend: Controller Commission](Backend-_Controller_Commission.md) (2 shared connections)
- [Backend: Delivery Repository](Backend-_Delivery_Repository.md) (2 shared connections)
- [Backend Middleware & Ownership Guards](Backend_Middleware_&_Ownership_Guards.md) (2 shared connections)
- [Backend: Order Controller](Backend-_Order_Controller.md) (2 shared connections)

## Source Files

- `apps/backend/src/controllers/delivery.controller.ts`
- `apps/backend/src/routes/delivery.routes.ts`
- `apps/backend/src/services/delivery.service.ts`
- `apps/backend/src/validators/delivery.schema.ts`

## Audit Trail

- EXTRACTED: 52 (98%)
- INFERRED: 1 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*