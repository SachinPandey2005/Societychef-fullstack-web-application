# Backend: Admin Controller

> 39 nodes · cohesion 0.09

## Key Concepts

- **dashboard.repository.ts** (19 connections) — `apps/backend/src/repositories/dashboard.repository.ts`
- **dashboard.ts** (15 connections) — `apps/backend/src/types/dashboard.ts`
- **admin.controller.ts** (13 connections) — `apps/backend/src/controllers/admin.controller.ts`
- **DashboardRepository** (13 connections) — `apps/backend/src/repositories/dashboard.repository.ts`
- **dashboard.service.ts** (6 connections) — `apps/backend/src/services/dashboard.service.ts`
- **AdminController** (5 connections) — `apps/backend/src/controllers/admin.controller.ts`
- **.getFinanceSummary()** (4 connections) — `apps/backend/src/repositories/dashboard.repository.ts`
- **FeatureFlagService** (4 connections) — `apps/backend/src/services/feature_flag.service.ts`
- **.toggleFeatureFlag()** (3 connections) — `apps/backend/src/controllers/admin.controller.ts`
- **.toggleMaintenanceMode()** (3 connections) — `apps/backend/src/controllers/admin.controller.ts`
- **setMaintenanceMode()** (3 connections) — `apps/backend/src/middleware/maintenance.middleware.ts`
- **AuditService** (3 connections) — `apps/backend/src/services/audit.service.ts`
- **.logAdminAction()** (3 connections) — `apps/backend/src/services/audit.service.ts`
- **DashboardStats** (3 connections) — `apps/backend/src/types/dashboard.ts`
- **FinanceSummaryData** (3 connections) — `apps/backend/src/types/dashboard.ts`
- **FinancialActivityItem** (3 connections) — `apps/backend/src/types/dashboard.ts`
- **OrdersSummaryData** (3 connections) — `apps/backend/src/types/dashboard.ts`
- **PaymentSummaryData** (3 connections) — `apps/backend/src/types/dashboard.ts`
- **PerformanceMetricsData** (3 connections) — `apps/backend/src/types/dashboard.ts`
- **RevenueAnalyticsPoint** (3 connections) — `apps/backend/src/types/dashboard.ts`
- **SettlementsSummaryData** (3 connections) — `apps/backend/src/types/dashboard.ts`
- **TopChefData** (3 connections) — `apps/backend/src/types/dashboard.ts`
- **TopSocietyData** (3 connections) — `apps/backend/src/types/dashboard.ts`
- **.getOrdersSummary()** (2 connections) — `apps/backend/src/repositories/dashboard.repository.ts`
- **.getOverviewStats()** (2 connections) — `apps/backend/src/repositories/dashboard.repository.ts`
- *... and 14 more nodes in this community*

## Relationships

- [Backend: Dashboard Controller](Backend-_Dashboard_Controller.md) (5 shared connections)
- [Supabase Client & Auth Policies](Supabase_Client_&_Auth_Policies.md) (4 shared connections)
- [Backend Routing & Health Controllers](Backend_Routing_&_Health_Controllers.md) (3 shared connections)
- [Backend: Service Idempotency](Backend-_Service_Idempotency.md) (2 shared connections)
- [Platform Compliance & Fraud Detection](Platform_Compliance_&_Fraud_Detection.md) (2 shared connections)
- [Backend: Device Controller](Backend-_Device_Controller.md) (2 shared connections)

## Source Files

- `apps/backend/src/controllers/admin.controller.ts`
- `apps/backend/src/middleware/maintenance.middleware.ts`
- `apps/backend/src/repositories/dashboard.repository.ts`
- `apps/backend/src/services/audit.service.ts`
- `apps/backend/src/services/dashboard.service.ts`
- `apps/backend/src/services/feature_flag.service.ts`
- `apps/backend/src/types/dashboard.ts`

## Audit Trail

- EXTRACTED: 85 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*