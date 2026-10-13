# Backend: Updateassignmentstatus Deliveryservice

> 7 nodes · cohesion 0.43

## Key Concepts

- **DeliveryService** (10 connections) — `apps/backend/src/services/delivery.service.ts`
- **.updateStatus()** (6 connections) — `apps/backend/src/services/delivery.service.ts`
- **updateAssignmentStatus** (4 connections) — `apps/backend/src/controllers/delivery.controller.ts`
- **.assignPartner()** (4 connections) — `apps/backend/src/services/delivery.service.ts`
- **.generateOTP()** (2 connections) — `apps/backend/src/services/delivery.service.ts`
- **.init()** (2 connections) — `apps/backend/src/services/delivery.service.ts`
- **.validateGeofence()** (2 connections) — `apps/backend/src/services/delivery.service.ts`

## Relationships

- [Backend: Delivery Controller](Backend-_Delivery_Controller.md) (5 shared connections)
- [Backend Middleware & Ownership Guards](Backend_Middleware_&_Ownership_Guards.md) (4 shared connections)
- [Backend CRM & Complaint Handlers](Backend_CRM_&_Complaint_Handlers.md) (1 shared connections)
- [Backend: Cart Repository](Backend-_Cart_Repository.md) (1 shared connections)
- [Backend: Delivery Repository](Backend-_Delivery_Repository.md) (1 shared connections)

## Source Files

- `apps/backend/src/controllers/delivery.controller.ts`
- `apps/backend/src/services/delivery.service.ts`

## Audit Trail

- EXTRACTED: 21 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*