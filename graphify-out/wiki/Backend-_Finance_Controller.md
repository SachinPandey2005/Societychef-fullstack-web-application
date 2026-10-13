# Backend: Finance Controller

> 39 nodes · cohesion 0.08

## Key Concepts

- **finance.controller.ts** (35 connections) — `apps/backend/src/controllers/finance.controller.ts`
- **invoice.repository.ts** (9 connections) — `apps/backend/src/repositories/invoice.repository.ts`
- **PayoutService** (9 connections) — `apps/backend/src/services/payout.service.ts`
- **InvoiceRepository** (8 connections) — `apps/backend/src/repositories/invoice.repository.ts`
- **.payChef()** (7 connections) — `apps/backend/src/services/payout.service.ts`
- **InvoiceService** (6 connections) — `apps/backend/src/services/invoice.service.ts`
- **getMyWallet** (5 connections) — `apps/backend/src/controllers/finance.controller.ts`
- **.updatePayoutStatus()** (5 connections) — `apps/backend/src/repositories/invoice.repository.ts`
- **invoice.ts** (5 connections) — `apps/backend/src/types/invoice.ts`
- **PayoutRequest** (5 connections) — `apps/backend/src/types/invoice.ts`
- **finance.schema.ts** (5 connections) — `apps/backend/src/validators/finance.schema.ts`
- **getJournalEntries** (4 connections) — `apps/backend/src/controllers/finance.controller.ts`
- **getMyInvoices** (4 connections) — `apps/backend/src/controllers/finance.controller.ts`
- **requestPayout** (4 connections) — `apps/backend/src/controllers/finance.controller.ts`
- **topupWallet** (4 connections) — `apps/backend/src/controllers/finance.controller.ts`
- **updatePayoutStatus** (4 connections) — `apps/backend/src/controllers/finance.controller.ts`
- **.getPayoutsByKitchen()** (4 connections) — `apps/backend/src/repositories/invoice.repository.ts`
- **.requestPayout()** (4 connections) — `apps/backend/src/repositories/invoice.repository.ts`
- **Invoice** (4 connections) — `apps/backend/src/types/invoice.ts`
- **getFinanceOverview** (3 connections) — `apps/backend/src/controllers/finance.controller.ts`
- **.createInvoice()** (3 connections) — `apps/backend/src/repositories/invoice.repository.ts`
- **.getInvoices()** (3 connections) — `apps/backend/src/repositories/invoice.repository.ts`
- **.getJournals()** (3 connections) — `apps/backend/src/services/accounting.service.ts`
- **.generateOrderInvoice()** (3 connections) — `apps/backend/src/services/invoice.service.ts`
- **.getConsumerInvoices()** (3 connections) — `apps/backend/src/services/invoice.service.ts`
- *... and 14 more nodes in this community*

## Relationships

- [Supabase Client & Auth Policies](Supabase_Client_&_Auth_Policies.md) (10 shared connections)
- [Backend CRM & Complaint Handlers](Backend_CRM_&_Complaint_Handlers.md) (9 shared connections)
- [Backend Routing & Health Controllers](Backend_Routing_&_Health_Controllers.md) (8 shared connections)
- [Financial Ledger & Refund Services](Financial_Ledger_&_Refund_Services.md) (7 shared connections)
- [Campaigns & Coupon Engine](Campaigns_&_Coupon_Engine.md) (7 shared connections)
- [Platform Compliance & Fraud Detection](Platform_Compliance_&_Fraud_Detection.md) (6 shared connections)
- [Backend: Accounting Repository](Backend-_Accounting_Repository.md) (3 shared connections)
- [Backend Middleware & Ownership Guards](Backend_Middleware_&_Ownership_Guards.md) (3 shared connections)
- [Backend: Controller Commission](Backend-_Controller_Commission.md) (2 shared connections)
- [Backend: Report Exportorders](Backend-_Report_Exportorders.md) (1 shared connections)
- [Backend: Order Controller](Backend-_Order_Controller.md) (1 shared connections)

## Source Files

- `apps/backend/src/controllers/finance.controller.ts`
- `apps/backend/src/repositories/invoice.repository.ts`
- `apps/backend/src/services/accounting.service.ts`
- `apps/backend/src/services/invoice.service.ts`
- `apps/backend/src/services/payout.service.ts`
- `apps/backend/src/services/wallet.service.ts`
- `apps/backend/src/types/invoice.ts`
- `apps/backend/src/validators/finance.schema.ts`

## Audit Trail

- EXTRACTED: 119 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*