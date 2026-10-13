# Backend: Dispute Repository

> 19 nodes · cohesion 0.23

## Key Concepts

- **dispute.service.ts** (13 connections) — `apps/backend/src/services/dispute.service.ts`
- **DisputeCase** (12 connections) — `apps/backend/src/types/refund.ts`
- **dispute.repository.ts** (8 connections) — `apps/backend/src/repositories/dispute.repository.ts`
- **DisputeRepository** (8 connections) — `apps/backend/src/repositories/dispute.repository.ts`
- **DisputeService** (8 connections) — `apps/backend/src/services/dispute.service.ts`
- **DisputeComment** (7 connections) — `apps/backend/src/types/refund.ts`
- **.getDisputeById()** (5 connections) — `apps/backend/src/services/dispute.service.ts`
- **.updateDisputeStatus()** (5 connections) — `apps/backend/src/services/dispute.service.ts`
- **.findById()** (4 connections) — `apps/backend/src/repositories/dispute.repository.ts`
- **.addComment()** (4 connections) — `apps/backend/src/services/dispute.service.ts`
- **.createDispute()** (4 connections) — `apps/backend/src/services/dispute.service.ts`
- **.getDisputes()** (4 connections) — `apps/backend/src/services/dispute.service.ts`
- **.addComment()** (3 connections) — `apps/backend/src/repositories/dispute.repository.ts`
- **.createDispute()** (3 connections) — `apps/backend/src/repositories/dispute.repository.ts`
- **.getComments()** (3 connections) — `apps/backend/src/repositories/dispute.repository.ts`
- **.getDisputes()** (3 connections) — `apps/backend/src/repositories/dispute.repository.ts`
- **.updateDispute()** (3 connections) — `apps/backend/src/repositories/dispute.repository.ts`
- **.getComments()** (3 connections) — `apps/backend/src/services/dispute.service.ts`
- **DisputeStatus** (2 connections) — `apps/backend/src/types/refund.ts`

## Relationships

- [Backend CRM & Complaint Handlers](Backend_CRM_&_Complaint_Handlers.md) (8 shared connections)
- [Financial Ledger & Refund Services](Financial_Ledger_&_Refund_Services.md) (5 shared connections)
- [Supabase Client & Auth Policies](Supabase_Client_&_Auth_Policies.md) (3 shared connections)
- [Backend Middleware & Ownership Guards](Backend_Middleware_&_Ownership_Guards.md) (3 shared connections)
- [Backend: Repository Campaign](Backend-_Repository_Campaign.md) (2 shared connections)
- [Backend: Crmrepository Assignpartnersociety](Backend-_Crmrepository_Assignpartnersociety.md) (1 shared connections)

## Source Files

- `apps/backend/src/repositories/dispute.repository.ts`
- `apps/backend/src/services/dispute.service.ts`
- `apps/backend/src/types/refund.ts`

## Audit Trail

- EXTRACTED: 62 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*