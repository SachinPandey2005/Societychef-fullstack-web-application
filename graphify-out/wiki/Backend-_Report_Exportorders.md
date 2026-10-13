# Backend: Report Exportorders

> 10 nodes · cohesion 0.33

## Key Concepts

- **report.controller.ts** (11 connections) — `apps/backend/src/controllers/report.controller.ts`
- **ReportService** (6 connections) — `apps/backend/src/services/report.service.ts`
- **report.service.ts** (5 connections) — `apps/backend/src/services/report.service.ts`
- **exportOrders** (4 connections) — `apps/backend/src/controllers/report.controller.ts`
- **exportFinancialReport** (3 connections) — `apps/backend/src/controllers/finance.controller.ts`
- **.convertToCSV()** (3 connections) — `apps/backend/src/services/report.service.ts`
- **.exportOrders()** (3 connections) — `apps/backend/src/services/report.service.ts`
- **analytics.schema.ts** (3 connections) — `apps/backend/src/validators/analytics.schema.ts`
- **.exportSettlements()** (2 connections) — `apps/backend/src/services/report.service.ts`
- **analyticsFilterSchema** (2 connections) — `apps/backend/src/validators/analytics.schema.ts`

## Relationships

- [Backend CRM & Complaint Handlers](Backend_CRM_&_Complaint_Handlers.md) (3 shared connections)
- [Backend: Controller Commission](Backend-_Controller_Commission.md) (2 shared connections)
- [Campaigns & Coupon Engine](Campaigns_&_Coupon_Engine.md) (2 shared connections)
- [Supabase Client & Auth Policies](Supabase_Client_&_Auth_Policies.md) (2 shared connections)
- [Backend: Finance Controller](Backend-_Finance_Controller.md) (1 shared connections)
- [Backend Routing & Health Controllers](Backend_Routing_&_Health_Controllers.md) (1 shared connections)
- [Backend: Order Controller](Backend-_Order_Controller.md) (1 shared connections)

## Source Files

- `apps/backend/src/controllers/finance.controller.ts`
- `apps/backend/src/controllers/report.controller.ts`
- `apps/backend/src/services/report.service.ts`
- `apps/backend/src/validators/analytics.schema.ts`

## Audit Trail

- EXTRACTED: 27 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*