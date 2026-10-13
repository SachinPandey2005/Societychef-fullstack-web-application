# Backend: Service Idempotency

> 9 nodes · cohesion 0.22

## Key Concepts

- **session.service.ts** (10 connections) — `apps/backend/src/services/session.service.ts`
- **idempotency.middleware.ts** (7 connections) — `apps/backend/src/middleware/idempotency.middleware.ts`
- **feature_flag.service.ts** (6 connections) — `apps/backend/src/services/feature_flag.service.ts`
- **lru-cache** (6 connections) — `apps/backend/package.json`
- **requireIdempotency()** (2 connections) — `apps/backend/src/middleware/idempotency.middleware.ts`
- **idempotencyCache** (1 connections) — `apps/backend/src/middleware/idempotency.middleware.ts`
- **flagCache** (1 connections) — `apps/backend/src/services/feature_flag.service.ts`
- **sessionCache** (1 connections) — `apps/backend/src/services/session.service.ts`
- **userSessionsCache** (1 connections) — `apps/backend/src/services/session.service.ts`

## Relationships

- [Platform Compliance & Fraud Detection](Platform_Compliance_&_Fraud_Detection.md) (6 shared connections)
- [Backend Routing & Health Controllers](Backend_Routing_&_Health_Controllers.md) (3 shared connections)
- [Backend: Order Controller](Backend-_Order_Controller.md) (2 shared connections)
- [Backend: Admin Controller](Backend-_Admin_Controller.md) (2 shared connections)
- [Backend: Auth Controller](Backend-_Auth_Controller.md) (2 shared connections)
- [Backend: Service Controller](Backend-_Service_Controller.md) (1 shared connections)
- [Backend: Server Allowedorigins](Backend-_Server_Allowedorigins.md) (1 shared connections)
- [Backend: Supabase Backend](Backend-_Supabase_Backend.md) (1 shared connections)
- [Backend: Device Controller](Backend-_Device_Controller.md) (1 shared connections)

## Source Files

- `apps/backend/package.json`
- `apps/backend/src/middleware/idempotency.middleware.ts`
- `apps/backend/src/services/feature_flag.service.ts`
- `apps/backend/src/services/session.service.ts`

## Audit Trail

- EXTRACTED: 26 (96%)
- INFERRED: 1 (4%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*