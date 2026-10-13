# Backend: Settlement Repository

> 18 nodes · cohesion 0.22

## Key Concepts

- **SettlementRepository** (15 connections) — `apps/backend/src/repositories/settlement.repository.ts`
- **settlement.repository.ts** (12 connections) — `apps/backend/src/repositories/settlement.repository.ts`
- **Settlement** (9 connections) — `apps/backend/src/types/settlement.ts`
- **SettlementStatus** (8 connections) — `apps/backend/src/types/settlement.ts`
- **settlement.ts** (7 connections) — `apps/backend/src/types/settlement.ts`
- **.bulkUpdateStatus()** (3 connections) — `apps/backend/src/repositories/settlement.repository.ts`
- **.createSettlement()** (3 connections) — `apps/backend/src/repositories/settlement.repository.ts`
- **.getSettlementsExtended()** (3 connections) — `apps/backend/src/repositories/settlement.repository.ts`
- **.updateStatus()** (3 connections) — `apps/backend/src/repositories/settlement.repository.ts`
- **SettlementDetailsResponse** (3 connections) — `apps/backend/src/types/settlement.ts`
- **SettlementSummaryMetrics** (3 connections) — `apps/backend/src/types/settlement.ts`
- **.findSettlementByTransactionId()** (2 connections) — `apps/backend/src/repositories/settlement.repository.ts`
- **.getPendingSettlements()** (2 connections) — `apps/backend/src/repositories/settlement.repository.ts`
- **.getSettlementDetailsWithOrders()** (2 connections) — `apps/backend/src/repositories/settlement.repository.ts`
- **.getSettlementsByKitchen()** (2 connections) — `apps/backend/src/repositories/settlement.repository.ts`
- **.getSettlementSummaryMetrics()** (2 connections) — `apps/backend/src/repositories/settlement.repository.ts`
- **.logFinancialAudit()** (2 connections) — `apps/backend/src/repositories/settlement.repository.ts`
- **.updateSettlementRecord()** (2 connections) — `apps/backend/src/repositories/settlement.repository.ts`

## Relationships

- [Backend Middleware & Ownership Guards](Backend_Middleware_&_Ownership_Guards.md) (9 shared connections)
- [Supabase Client & Auth Policies](Supabase_Client_&_Auth_Policies.md) (4 shared connections)
- [Financial Ledger & Refund Services](Financial_Ledger_&_Refund_Services.md) (2 shared connections)

## Source Files

- `apps/backend/src/repositories/settlement.repository.ts`
- `apps/backend/src/types/settlement.ts`

## Audit Trail

- EXTRACTED: 49 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*