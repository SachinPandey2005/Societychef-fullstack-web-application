# Backend: Delivery Repository

> 17 nodes · cohesion 0.24

## Key Concepts

- **DeliveryRepository** (12 connections) — `apps/backend/src/repositories/delivery.repository.ts`
- **delivery.repository.ts** (11 connections) — `apps/backend/src/repositories/delivery.repository.ts`
- **delivery.ts** (7 connections) — `apps/backend/src/types/delivery.ts`
- **DeliveryAssignment** (6 connections) — `apps/backend/src/types/delivery.ts`
- **DeliveryPartner** (5 connections) — `apps/backend/src/types/delivery.ts`
- **DeliveryStatus** (5 connections) — `apps/backend/src/types/delivery.ts`
- **.getAssignment()** (3 connections) — `apps/backend/src/repositories/delivery.repository.ts`
- **.recordTracking()** (3 connections) — `apps/backend/src/repositories/delivery.repository.ts`
- **.updateAssignmentStatus()** (3 connections) — `apps/backend/src/repositories/delivery.repository.ts`
- **DeliveryEarnings** (3 connections) — `apps/backend/src/types/delivery.ts`
- **DeliveryTracking** (3 connections) — `apps/backend/src/types/delivery.ts`
- **.createAssignment()** (2 connections) — `apps/backend/src/repositories/delivery.repository.ts`
- **.createEarnings()** (2 connections) — `apps/backend/src/repositories/delivery.repository.ts`
- **.getAssignmentByOrder()** (2 connections) — `apps/backend/src/repositories/delivery.repository.ts`
- **.getAvailablePartners()** (2 connections) — `apps/backend/src/repositories/delivery.repository.ts`
- **.registerPartner()** (2 connections) — `apps/backend/src/repositories/delivery.repository.ts`
- **.updatePartnerStatus()** (2 connections) — `apps/backend/src/repositories/delivery.repository.ts`

## Relationships

- [Backend Middleware & Ownership Guards](Backend_Middleware_&_Ownership_Guards.md) (4 shared connections)
- [Supabase Client & Auth Policies](Supabase_Client_&_Auth_Policies.md) (2 shared connections)
- [Backend: Delivery Controller](Backend-_Delivery_Controller.md) (2 shared connections)
- [Backend: Updateassignmentstatus Deliveryservice](Backend-_Updateassignmentstatus_Deliveryservice.md) (1 shared connections)

## Source Files

- `apps/backend/src/repositories/delivery.repository.ts`
- `apps/backend/src/types/delivery.ts`

## Audit Trail

- EXTRACTED: 41 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*