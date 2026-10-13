# Backend: Device Controller

> 38 nodes · cohesion 0.07

## Key Concepts

- **sendError()** (36 connections) — `apps/backend/src/utils/response.ts`
- **device.controller.ts** (10 connections) — `apps/backend/src/controllers/device.controller.ts`
- **apiKey.middleware.ts** (10 connections) — `apps/backend/src/middleware/apiKey.middleware.ts`
- **errorHandler.ts** (10 connections) — `apps/backend/src/middleware/errorHandler.ts`
- **api_security.middleware.ts** (9 connections) — `apps/backend/src/middleware/api_security.middleware.ts`
- **maintenance.middleware.ts** (9 connections) — `apps/backend/src/middleware/maintenance.middleware.ts`
- **file_security.middleware.ts** (7 connections) — `apps/backend/src/middleware/file_security.middleware.ts`
- **v1/index.ts** (5 connections) — `apps/backend/src/routes/public/v1/index.ts`
- **DeviceController** (4 connections) — `apps/backend/src/controllers/device.controller.ts`
- **.register()** (4 connections) — `apps/backend/src/controllers/device.controller.ts`
- **.revoke()** (4 connections) — `apps/backend/src/controllers/device.controller.ts`
- **PlatformController** (4 connections) — `apps/backend/src/controllers/platform.controller.ts`
- **.registerTenant()** (4 connections) — `apps/backend/src/controllers/platform.controller.ts`
- **PrivacyController** (4 connections) — `apps/backend/src/controllers/privacy.controller.ts`
- **.exportData()** (4 connections) — `apps/backend/src/controllers/privacy.controller.ts`
- **.requestDeletion()** (4 connections) — `apps/backend/src/controllers/privacy.controller.ts`
- **requireApiKey()** (4 connections) — `apps/backend/src/middleware/apiKey.middleware.ts`
- **timingSafeEqual()** (4 connections) — `apps/backend/src/middleware/apiKey.middleware.ts`
- **device.service.ts** (4 connections) — `apps/backend/src/services/device.service.ts`
- **DeviceService** (4 connections) — `apps/backend/src/services/device.service.ts`
- **PrivacyService** (4 connections) — `apps/backend/src/services/privacy.service.ts`
- **TenantService** (4 connections) — `apps/backend/src/services/tenant.service.ts`
- **.getTenantStatus()** (3 connections) — `apps/backend/src/controllers/platform.controller.ts`
- **requireReplayProtection()** (3 connections) — `apps/backend/src/middleware/api_security.middleware.ts`
- **errorHandler()** (3 connections) — `apps/backend/src/middleware/errorHandler.ts`
- *... and 13 more nodes in this community*

## Relationships

- [Platform Compliance & Fraud Detection](Platform_Compliance_&_Fraud_Detection.md) (23 shared connections)
- [Backend Routing & Health Controllers](Backend_Routing_&_Health_Controllers.md) (20 shared connections)
- [Backend CRM & Complaint Handlers](Backend_CRM_&_Complaint_Handlers.md) (14 shared connections)
- [Backend: Payment Controller](Backend-_Payment_Controller.md) (4 shared connections)
- [Backend: Controller Bicontroller](Backend-_Controller_Bicontroller.md) (3 shared connections)
- [Backend: Deletekitchen Kitchen](Backend-_Deletekitchen_Kitchen.md) (3 shared connections)
- [Backend Middleware & Ownership Guards](Backend_Middleware_&_Ownership_Guards.md) (2 shared connections)
- [Backend: Server Allowedorigins](Backend-_Server_Allowedorigins.md) (2 shared connections)
- [Backend: Admin Controller](Backend-_Admin_Controller.md) (2 shared connections)
- [Backend: Compliancecontroller Exportdata](Backend-_Compliancecontroller_Exportdata.md) (2 shared connections)
- [Backend: Service Idempotency](Backend-_Service_Idempotency.md) (1 shared connections)
- [Backend: Auth Controller](Backend-_Auth_Controller.md) (1 shared connections)

## Source Files

- `apps/backend/src/controllers/device.controller.ts`
- `apps/backend/src/controllers/platform.controller.ts`
- `apps/backend/src/controllers/privacy.controller.ts`
- `apps/backend/src/middleware/apiKey.middleware.ts`
- `apps/backend/src/middleware/api_security.middleware.ts`
- `apps/backend/src/middleware/auth.middleware.ts`
- `apps/backend/src/middleware/errorHandler.ts`
- `apps/backend/src/middleware/file_security.middleware.ts`
- `apps/backend/src/middleware/maintenance.middleware.ts`
- `apps/backend/src/routes/public/v1/index.ts`
- `apps/backend/src/services/device.service.ts`
- `apps/backend/src/services/privacy.service.ts`
- `apps/backend/src/services/tenant.service.ts`
- `apps/backend/src/utils/response.ts`

## Audit Trail

- EXTRACTED: 128 (98%)
- INFERRED: 3 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*