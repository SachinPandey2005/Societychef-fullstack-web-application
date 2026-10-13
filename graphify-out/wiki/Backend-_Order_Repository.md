# Backend: Order Repository

> 23 nodes · cohesion 0.17

## Key Concepts

- **order.repository.ts** (19 connections) — `apps/backend/src/repositories/order.repository.ts`
- **OrderRepository** (19 connections) — `apps/backend/src/repositories/order.repository.ts`
- **order.ts** (13 connections) — `apps/backend/src/types/order.ts`
- **Order** (8 connections) — `apps/backend/src/types/order.ts`
- **OrderItem** (5 connections) — `apps/backend/src/types/order.ts`
- **OrderStatus** (5 connections) — `apps/backend/src/types/order.ts`
- **.createOrder()** (3 connections) — `apps/backend/src/repositories/order.repository.ts`
- **.updateOrderStatus()** (3 connections) — `apps/backend/src/repositories/order.repository.ts`
- **.updatePaymentStatus()** (3 connections) — `apps/backend/src/repositories/order.repository.ts`
- **CreateOrderInput** (3 connections) — `apps/backend/src/types/order.ts`
- **OrderFilterParams** (3 connections) — `apps/backend/src/types/order.ts`
- **OrderFinancialSummary** (3 connections) — `apps/backend/src/types/order.ts`
- **OrderPaymentStatus** (3 connections) — `apps/backend/src/types/order.ts`
- **OrderSettlementStatus** (3 connections) — `apps/backend/src/types/order.ts`
- **.createOrderItems()** (2 connections) — `apps/backend/src/repositories/order.repository.ts`
- **.getConsumerHistory()** (2 connections) — `apps/backend/src/repositories/order.repository.ts`
- **.getKitchenHistory()** (2 connections) — `apps/backend/src/repositories/order.repository.ts`
- **.getOrderById()** (2 connections) — `apps/backend/src/repositories/order.repository.ts`
- **.getOrderFinancialSummary()** (2 connections) — `apps/backend/src/repositories/order.repository.ts`
- **.getOrderItems()** (2 connections) — `apps/backend/src/repositories/order.repository.ts`
- **.searchOrdersExtended()** (2 connections) — `apps/backend/src/repositories/order.repository.ts`
- **.updateSettlementStatus()** (2 connections) — `apps/backend/src/repositories/order.repository.ts`
- **OrderPaymentMethod** (1 connections) — `apps/backend/src/types/order.ts`

## Relationships

- [Backend Middleware & Ownership Guards](Backend_Middleware_&_Ownership_Guards.md) (8 shared connections)
- [Financial Ledger & Refund Services](Financial_Ledger_&_Refund_Services.md) (4 shared connections)
- [Supabase Client & Auth Policies](Supabase_Client_&_Auth_Policies.md) (2 shared connections)
- [Platform Compliance & Fraud Detection](Platform_Compliance_&_Fraud_Detection.md) (2 shared connections)
- [Backend: Config Envschema](Backend-_Config_Envschema.md) (2 shared connections)
- [Backend: Chat Controller](Backend-_Chat_Controller.md) (2 shared connections)
- [Backend: Cart Repository](Backend-_Cart_Repository.md) (2 shared connections)

## Source Files

- `apps/backend/src/repositories/order.repository.ts`
- `apps/backend/src/types/order.ts`

## Audit Trail

- EXTRACTED: 66 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*