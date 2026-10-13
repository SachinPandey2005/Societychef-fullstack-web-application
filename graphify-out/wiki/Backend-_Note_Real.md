# Backend: Note Real

> 13 nodes · cohesion 0.24

## Key Concepts

- **execution_handover.routes.ts** (16 connections) — `apps/backend/src/routes/execution_handover.routes.ts`
- **execution_handover.controller.ts** (13 connections) — `apps/backend/src/controllers/execution_handover.controller.ts`
- **completeDelivery()** (2 connections) — `apps/backend/src/controllers/execution_handover.controller.ts`
- **confirmPickup()** (2 connections) — `apps/backend/src/controllers/execution_handover.controller.ts`
- **getDeliveryStatus()** (2 connections) — `apps/backend/src/controllers/execution_handover.controller.ts`
- **reportIssue()** (2 connections) — `apps/backend/src/controllers/execution_handover.controller.ts`
- **submitProofOfDelivery()** (2 connections) — `apps/backend/src/controllers/execution_handover.controller.ts`
- **verifyChefPin()** (2 connections) — `apps/backend/src/controllers/execution_handover.controller.ts`
- **verifyCustomerOtp()** (2 connections) — `apps/backend/src/controllers/execution_handover.controller.ts`
- **router** (2 connections) — `apps/backend/src/routes/execution_handover.routes.ts`
- **NOTE: there is no real per-order PIN generated/stored anywhere yet** (1 connections) — `apps/backend/src/controllers/execution_handover.controller.ts`
- **NOTE: same caveat as verifyChefPin above — no real per-order OTP is** (1 connections) — `apps/backend/src/controllers/execution_handover.controller.ts`
- **partnerOnly** (1 connections) — `apps/backend/src/routes/execution_handover.routes.ts`

## Relationships

- [Backend Routing & Health Controllers](Backend_Routing_&_Health_Controllers.md) (8 shared connections)
- [Supabase Client & Auth Policies](Supabase_Client_&_Auth_Policies.md) (2 shared connections)

## Source Files

- `apps/backend/src/controllers/execution_handover.controller.ts`
- `apps/backend/src/routes/execution_handover.routes.ts`

## Audit Trail

- EXTRACTED: 21 (72%)
- INFERRED: 8 (28%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*