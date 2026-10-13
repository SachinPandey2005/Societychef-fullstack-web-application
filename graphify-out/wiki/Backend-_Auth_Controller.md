# Backend: Auth Controller

> 27 nodes · cohesion 0.14

## Key Concepts

- **auth.controller.ts** (34 connections) — `apps/backend/src/controllers/auth.controller.ts`
- **auth.routes.ts** (17 connections) — `apps/backend/src/routes/auth.routes.ts`
- **AppError** (11 connections) — `apps/backend/src/utils/errors.ts`
- **SessionService** (10 connections) — `apps/backend/src/services/session.service.ts`
- **verifyOtp** (7 connections) — `apps/backend/src/controllers/auth.controller.ts`
- **auth.schema.ts** (6 connections) — `apps/backend/src/validators/auth.schema.ts`
- **deleteAccount** (5 connections) — `apps/backend/src/controllers/auth.controller.ts`
- **logout** (5 connections) — `apps/backend/src/controllers/auth.controller.ts`
- **adminLogin** (4 connections) — `apps/backend/src/controllers/auth.controller.ts`
- **refreshToken** (4 connections) — `apps/backend/src/controllers/auth.controller.ts`
- **sendOtp** (4 connections) — `apps/backend/src/controllers/auth.controller.ts`
- **updateProfile** (4 connections) — `apps/backend/src/controllers/auth.controller.ts`
- **clearCachedToken()** (4 connections) — `apps/backend/src/middleware/auth.middleware.ts`
- **.registerSession()** (4 connections) — `apps/backend/src/services/session.service.ts`
- **.revokeSession()** (4 connections) — `apps/backend/src/services/session.service.ts`
- **getMe** (3 connections) — `apps/backend/src/controllers/auth.controller.ts`
- **getProfile** (3 connections) — `apps/backend/src/controllers/auth.controller.ts`
- **.enforceConcurrentLimits()** (3 connections) — `apps/backend/src/services/session.service.ts`
- **express-rate-limit** (3 connections) — `apps/backend/package.json`
- **router** (2 connections) — `apps/backend/src/routes/auth.routes.ts`
- **.isSessionActive()** (2 connections) — `apps/backend/src/services/session.service.ts`
- **adminLoginSchema** (2 connections) — `apps/backend/src/validators/auth.schema.ts`
- **sendOtpSchema** (2 connections) — `apps/backend/src/validators/auth.schema.ts`
- **updateAuthProfileSchema** (2 connections) — `apps/backend/src/validators/auth.schema.ts`
- **verifyOtpSchema** (2 connections) — `apps/backend/src/validators/auth.schema.ts`
- *... and 2 more nodes in this community*

## Relationships

- [Backend CRM & Complaint Handlers](Backend_CRM_&_Complaint_Handlers.md) (11 shared connections)
- [Backend Routing & Health Controllers](Backend_Routing_&_Health_Controllers.md) (11 shared connections)
- [User Profiles & Admin Bootstrap](User_Profiles_&_Admin_Bootstrap.md) (5 shared connections)
- [Backend Middleware & Ownership Guards](Backend_Middleware_&_Ownership_Guards.md) (5 shared connections)
- [Backend: Config Envschema](Backend-_Config_Envschema.md) (2 shared connections)
- [Backend: Controller Commission](Backend-_Controller_Commission.md) (2 shared connections)
- [Supabase Client & Auth Policies](Supabase_Client_&_Auth_Policies.md) (2 shared connections)
- [Backend: Service Idempotency](Backend-_Service_Idempotency.md) (2 shared connections)
- [Backend: Server Allowedorigins](Backend-_Server_Allowedorigins.md) (2 shared connections)
- [Backend: Service Controller](Backend-_Service_Controller.md) (1 shared connections)
- [Backend: Opscontroller Businessmetrics](Backend-_Opscontroller_Businessmetrics.md) (1 shared connections)
- [Backend: Device Controller](Backend-_Device_Controller.md) (1 shared connections)

## Source Files

- `apps/backend/package.json`
- `apps/backend/src/controllers/auth.controller.ts`
- `apps/backend/src/middleware/auth.middleware.ts`
- `apps/backend/src/routes/auth.routes.ts`
- `apps/backend/src/services/session.service.ts`
- `apps/backend/src/utils/errors.ts`
- `apps/backend/src/validators/auth.schema.ts`

## Audit Trail

- EXTRACTED: 97 (99%)
- INFERRED: 1 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*