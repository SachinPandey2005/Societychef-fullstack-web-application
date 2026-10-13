# Backend: Compliancecontroller Exportdata

> 11 nodes · cohesion 0.22

## Key Concepts

- **SecurityAdminController** (5 connections) — `apps/backend/src/controllers/security_admin.controller.ts`
- **ComplianceController** (4 connections) — `apps/backend/src/controllers/compliance.controller.ts`
- **.exportData()** (4 connections) — `apps/backend/src/controllers/compliance.controller.ts`
- **.requestDeletion()** (4 connections) — `apps/backend/src/controllers/compliance.controller.ts`
- **.logSecurityEvent()** (4 connections) — `apps/backend/src/repositories/audit.repository.ts`
- **ComplianceService** (4 connections) — `apps/backend/src/services/compliance.service.ts`
- **.exportUserData()** (3 connections) — `apps/backend/src/services/compliance.service.ts`
- **.requestDataDeletion()** (3 connections) — `apps/backend/src/services/compliance.service.ts`
- **.triggerAuditReport()** (2 connections) — `apps/backend/src/controllers/security_admin.controller.ts`
- **.getActiveSessions()** (1 connections) — `apps/backend/src/controllers/security_admin.controller.ts`
- **.getComplianceRequests()** (1 connections) — `apps/backend/src/controllers/security_admin.controller.ts`

## Relationships

- [Platform Compliance & Fraud Detection](Platform_Compliance_&_Fraud_Detection.md) (5 shared connections)
- [Backend Routing & Health Controllers](Backend_Routing_&_Health_Controllers.md) (2 shared connections)
- [Backend: Device Controller](Backend-_Device_Controller.md) (2 shared connections)
- [Backend CRM & Complaint Handlers](Backend_CRM_&_Complaint_Handlers.md) (2 shared connections)

## Source Files

- `apps/backend/src/controllers/compliance.controller.ts`
- `apps/backend/src/controllers/security_admin.controller.ts`
- `apps/backend/src/repositories/audit.repository.ts`
- `apps/backend/src/services/compliance.service.ts`

## Audit Trail

- EXTRACTED: 23 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*