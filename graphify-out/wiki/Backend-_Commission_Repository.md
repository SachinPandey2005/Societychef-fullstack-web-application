# Backend: Commission Repository

> 27 nodes · cohesion 0.15

## Key Concepts

- **commission.engine.ts** (9 connections) — `apps/backend/src/services/commission.engine.ts`
- **commission.service.ts** (9 connections) — `apps/backend/src/services/commission.service.ts`
- **commission.repository.ts** (8 connections) — `apps/backend/src/repositories/commission.repository.ts`
- **CommissionEngine** (8 connections) — `apps/backend/src/services/commission.engine.ts`
- **CommissionService** (8 connections) — `apps/backend/src/services/commission.service.ts`
- **commission.ts** (8 connections) — `apps/backend/src/types/commission.ts`
- **CommissionRepository** (7 connections) — `apps/backend/src/repositories/commission.repository.ts`
- **CommissionRule** (6 connections) — `apps/backend/src/types/commission.ts`
- **.calculateOrderFinancials()** (5 connections) — `apps/backend/src/services/commission.engine.ts`
- **CreateCommissionRuleInput** (5 connections) — `apps/backend/src/types/commission.ts`
- **UpdateCommissionRuleInput** (5 connections) — `apps/backend/src/types/commission.ts`
- **.createRule()** (4 connections) — `apps/backend/src/repositories/commission.repository.ts`
- **.updateRule()** (4 connections) — `apps/backend/src/repositories/commission.repository.ts`
- **.createRule()** (4 connections) — `apps/backend/src/services/commission.service.ts`
- **.updateRule()** (4 connections) — `apps/backend/src/services/commission.service.ts`
- **.getAllRules()** (3 connections) — `apps/backend/src/repositories/commission.repository.ts`
- **.getRuleById()** (3 connections) — `apps/backend/src/repositories/commission.repository.ts`
- **.getCommissionRule()** (3 connections) — `apps/backend/src/services/commission.engine.ts`
- **.resolveCommissionRule()** (3 connections) — `apps/backend/src/services/commission.engine.ts`
- **.calculateOrderCommission()** (3 connections) — `apps/backend/src/services/commission.service.ts`
- **.deleteRule()** (3 connections) — `apps/backend/src/services/commission.service.ts`
- **.getAllRules()** (3 connections) — `apps/backend/src/services/commission.service.ts`
- **CommissionCalculationResult** (3 connections) — `apps/backend/src/types/commission.ts`
- **.deleteRule()** (2 connections) — `apps/backend/src/repositories/commission.repository.ts`
- **.getRuleById()** (2 connections) — `apps/backend/src/services/commission.service.ts`
- *... and 2 more nodes in this community*

## Relationships

- [Backend: Controller Commission](Backend-_Controller_Commission.md) (7 shared connections)
- [Supabase Client & Auth Policies](Supabase_Client_&_Auth_Policies.md) (4 shared connections)
- [Financial Ledger & Refund Services](Financial_Ledger_&_Refund_Services.md) (4 shared connections)
- [Backend Middleware & Ownership Guards](Backend_Middleware_&_Ownership_Guards.md) (3 shared connections)

## Source Files

- `apps/backend/src/repositories/commission.repository.ts`
- `apps/backend/src/services/commission.engine.ts`
- `apps/backend/src/services/commission.service.ts`
- `apps/backend/src/types/commission.ts`

## Audit Trail

- EXTRACTED: 71 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*