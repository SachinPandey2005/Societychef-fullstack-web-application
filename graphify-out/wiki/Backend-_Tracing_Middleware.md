# Backend: Tracing Middleware

> 10 nodes · cohesion 0.24

## Key Concepts

- **tracing.middleware.ts** (6 connections) — `apps/backend/src/middleware/tracing.middleware.ts`
- **telemetry.provider.ts** (5 connections) — `apps/backend/src/telemetry/telemetry.provider.ts`
- **uuid** (5 connections) — `apps/backend/package.json`
- **TelemetryProvider** (4 connections) — `apps/backend/src/telemetry/telemetry.provider.ts`
- **traceStorage** (3 connections) — `apps/backend/src/telemetry/telemetry.provider.ts`
- **injectTracing()** (2 connections) — `apps/backend/src/middleware/tracing.middleware.ts`
- **.maskPII()** (2 connections) — `apps/backend/src/telemetry/telemetry.provider.ts`
- **.recordMetric()** (2 connections) — `apps/backend/src/telemetry/telemetry.provider.ts`
- **.startSpan()** (1 connections) — `apps/backend/src/telemetry/telemetry.provider.ts`
- **ref_async_hooks** (1 connections)

## Relationships

- [Backend: Server Allowedorigins](Backend-_Server_Allowedorigins.md) (2 shared connections)
- [Platform Compliance & Fraud Detection](Platform_Compliance_&_Fraud_Detection.md) (2 shared connections)
- [Backend Routing & Health Controllers](Backend_Routing_&_Health_Controllers.md) (1 shared connections)
- [Backend: Supabase Backend](Backend-_Supabase_Backend.md) (1 shared connections)
- [Backend: Controller Chatwithai](Backend-_Controller_Chatwithai.md) (1 shared connections)
- [Backend: Seed Mock](Backend-_Seed_Mock.md) (1 shared connections)
- [Supabase Client & Auth Policies](Supabase_Client_&_Auth_Policies.md) (1 shared connections)

## Source Files

- `apps/backend/package.json`
- `apps/backend/src/middleware/tracing.middleware.ts`
- `apps/backend/src/telemetry/telemetry.provider.ts`

## Audit Trail

- EXTRACTED: 19 (95%)
- INFERRED: 1 (5%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*