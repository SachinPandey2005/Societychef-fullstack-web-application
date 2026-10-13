# Backend: Fraud Repository

> 31 nodes · cohesion 0.11

## Key Concepts

- **fraud.repository.ts** (11 connections) — `apps/backend/src/repositories/fraud.repository.ts`
- **FraudRepository** (10 connections) — `apps/backend/src/repositories/fraud.repository.ts`
- **fraud.service.test.ts** (9 connections) — `apps/backend/tests/unit/services/fraud.service.test.ts`
- **FraudService** (7 connections) — `apps/backend/src/services/fraud.service.ts`
- **fraud.ts** (7 connections) — `apps/backend/src/types/fraud.ts`
- **supabaseClient.ts** (7 connections) — `apps/backend/tests/mocks/supabaseClient.ts`
- **fraud_rule.service.ts** (6 connections) — `apps/backend/src/services/fraud_rule.service.ts`
- **FraudRule** (5 connections) — `apps/backend/src/types/fraud.ts`
- **FraudRuleService** (4 connections) — `apps/backend/src/services/fraud_rule.service.ts`
- **.evaluateEvent()** (4 connections) — `apps/backend/src/services/fraud_rule.service.ts`
- **.executeActions()** (4 connections) — `apps/backend/src/services/fraud.service.ts`
- **FraudCase** (4 connections) — `apps/backend/src/types/fraud.ts`
- **.createCase()** (3 connections) — `apps/backend/src/repositories/fraud.repository.ts`
- **.createRule()** (3 connections) — `apps/backend/src/repositories/fraud.repository.ts`
- **.getActiveRules()** (3 connections) — `apps/backend/src/repositories/fraud.repository.ts`
- **.resolveCase()** (3 connections) — `apps/backend/src/repositories/fraud.repository.ts`
- **.createRule()** (3 connections) — `apps/backend/src/services/fraud.service.ts`
- **.init()** (3 connections) — `apps/backend/src/services/fraud.service.ts`
- **.resolveCase()** (3 connections) — `apps/backend/src/services/fraud.service.ts`
- **TrustScore** (3 connections) — `apps/backend/src/types/fraud.ts`
- **.getTrustScore()** (2 connections) — `apps/backend/src/repositories/fraud.repository.ts`
- **.logActivity()** (2 connections) — `apps/backend/src/repositories/fraud.repository.ts`
- **.evaluateCondition()** (2 connections) — `apps/backend/src/services/fraud_rule.service.ts`
- **FraudActivityLog** (2 connections) — `apps/backend/src/types/fraud.ts`
- **supabase** (2 connections) — `apps/backend/tests/mocks/supabaseClient.ts`
- *... and 6 more nodes in this community*

## Relationships

- [Platform Compliance & Fraud Detection](Platform_Compliance_&_Fraud_Detection.md) (9 shared connections)
- [Backend: Controller Commission](Backend-_Controller_Commission.md) (3 shared connections)
- [Supabase Client & Auth Policies](Supabase_Client_&_Auth_Policies.md) (2 shared connections)

## Source Files

- `apps/backend/src/repositories/fraud.repository.ts`
- `apps/backend/src/services/fraud.service.ts`
- `apps/backend/src/services/fraud_rule.service.ts`
- `apps/backend/src/types/fraud.ts`
- `apps/backend/tests/mocks/supabaseClient.ts`
- `apps/backend/tests/unit/services/fraud.service.test.ts`

## Audit Trail

- EXTRACTED: 66 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*