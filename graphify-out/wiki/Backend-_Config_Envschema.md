# Backend: Config Envschema

> 30 nodes · cohesion 0.12

## Key Concepts

- **src/config/env.ts** (16 connections) — `apps/backend/src/config/env.ts`
- **cashfree.test.ts** (16 connections) — `apps/backend/src/tests/cashfree.test.ts`
- **env** (15 connections) — `apps/backend/src/config/env.ts`
- **cashfree.client.ts** (14 connections) — `apps/backend/src/integrations/cashfree.client.ts`
- **CashfreeClient** (11 connections) — `apps/backend/src/integrations/cashfree.client.ts`
- **.createOrder()** (6 connections) — `apps/backend/src/integrations/cashfree.client.ts`
- **crypto.ts** (6 connections) — `apps/backend/src/utils/crypto.ts`
- **.createRefund()** (5 connections) — `apps/backend/src/integrations/cashfree.client.ts`
- **.getBaseUrl()** (5 connections) — `apps/backend/src/integrations/cashfree.client.ts`
- **.getHeaders()** (5 connections) — `apps/backend/src/integrations/cashfree.client.ts`
- **.getOrder()** (5 connections) — `apps/backend/src/integrations/cashfree.client.ts`
- **.getOrderPayments()** (5 connections) — `apps/backend/src/integrations/cashfree.client.ts`
- **.isConfigured()** (5 connections) — `apps/backend/src/integrations/cashfree.client.ts`
- **secret.service.ts** (4 connections) — `apps/backend/src/services/secret.service.ts`
- **SecretService** (4 connections) — `apps/backend/src/services/secret.service.ts`
- **getEncryptionKey()** (4 connections) — `apps/backend/src/utils/crypto.ts`
- **.get()** (3 connections) — `apps/backend/src/services/secret.service.ts`
- **.getCheckoutBaseUrl()** (2 connections) — `apps/backend/src/integrations/cashfree.client.ts`
- **CashfreePaymentEntity** (2 connections) — `apps/backend/src/integrations/cashfree.client.ts`
- **.getRequired()** (2 connections) — `apps/backend/src/services/secret.service.ts`
- **decrypt()** (2 connections) — `apps/backend/src/utils/crypto.ts`
- **encrypt()** (2 connections) — `apps/backend/src/utils/crypto.ts`
- **envSchema** (1 connections) — `apps/backend/src/config/env.ts`
- **CashfreeCustomerDetails** (1 connections) — `apps/backend/src/integrations/cashfree.client.ts`
- **CashfreeOrderMeta** (1 connections) — `apps/backend/src/integrations/cashfree.client.ts`
- *... and 5 more nodes in this community*

## Relationships

- [Backend Middleware & Ownership Guards](Backend_Middleware_&_Ownership_Guards.md) (21 shared connections)
- [Supabase Client & Auth Policies](Supabase_Client_&_Auth_Policies.md) (2 shared connections)
- [Backend: Auth Controller](Backend-_Auth_Controller.md) (2 shared connections)
- [Backend: Payment Controller](Backend-_Payment_Controller.md) (2 shared connections)
- [Backend: Server Allowedorigins](Backend-_Server_Allowedorigins.md) (2 shared connections)
- [User Profiles & Admin Bootstrap](User_Profiles_&_Admin_Bootstrap.md) (2 shared connections)
- [Financial Ledger & Refund Services](Financial_Ledger_&_Refund_Services.md) (2 shared connections)
- [Platform Compliance & Fraud Detection](Platform_Compliance_&_Fraud_Detection.md) (2 shared connections)
- [Backend: Order Repository](Backend-_Order_Repository.md) (2 shared connections)
- [Backend: Repository Campaign](Backend-_Repository_Campaign.md) (2 shared connections)
- [Backend: Config Dotenv](Backend-_Config_Dotenv.md) (1 shared connections)
- [Backend: Order Controller](Backend-_Order_Controller.md) (1 shared connections)

## Source Files

- `apps/backend/src/config/env.ts`
- `apps/backend/src/integrations/cashfree.client.ts`
- `apps/backend/src/services/secret.service.ts`
- `apps/backend/src/tests/cashfree.test.ts`
- `apps/backend/src/utils/crypto.ts`

## Audit Trail

- EXTRACTED: 94 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*