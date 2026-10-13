# Backend: Inventory Adjuststock

> 38 nodes · cohesion 0.10

## Key Concepts

- **inventory.controller.ts** (18 connections) — `apps/backend/src/controllers/inventory.controller.ts`
- **inventory.repository.ts** (10 connections) — `apps/backend/src/repositories/inventory.repository.ts`
- **InventoryService** (10 connections) — `apps/backend/src/services/inventory.service.ts`
- **InventoryRepository** (9 connections) — `apps/backend/src/repositories/inventory.repository.ts`
- **inventory.ts** (8 connections) — `apps/backend/src/types/inventory.ts`
- **inventory.schema.ts** (7 connections) — `apps/backend/src/validators/inventory.schema.ts`
- **.adjustStock()** (5 connections) — `apps/backend/src/repositories/inventory.repository.ts`
- **.adjustStock()** (5 connections) — `apps/backend/src/services/inventory.service.ts`
- **.logWastage()** (5 connections) — `apps/backend/src/services/inventory.service.ts`
- **.processOrderDeduction()** (5 connections) — `apps/backend/src/services/inventory.service.ts`
- **InventoryRecord** (5 connections) — `apps/backend/src/types/inventory.ts`
- **addIngredient** (4 connections) — `apps/backend/src/controllers/inventory.controller.ts`
- **adjustStock** (4 connections) — `apps/backend/src/controllers/inventory.controller.ts`
- **getInventory** (4 connections) — `apps/backend/src/controllers/inventory.controller.ts`
- **logWastage** (4 connections) — `apps/backend/src/controllers/inventory.controller.ts`
- **mapRecipe** (4 connections) — `apps/backend/src/controllers/inventory.controller.ts`
- **.getInventoryRecord()** (4 connections) — `apps/backend/src/repositories/inventory.repository.ts`
- **RecipeIngredient** (4 connections) — `apps/backend/src/types/inventory.ts`
- **.addRecipeIngredient()** (3 connections) — `apps/backend/src/repositories/inventory.repository.ts`
- **.createIngredient()** (3 connections) — `apps/backend/src/repositories/inventory.repository.ts`
- **.getInventory()** (3 connections) — `apps/backend/src/repositories/inventory.repository.ts`
- **.getRecipeForDish()** (3 connections) — `apps/backend/src/repositories/inventory.repository.ts`
- **.logWastage()** (3 connections) — `apps/backend/src/repositories/inventory.repository.ts`
- **.addRecipeIngredient()** (3 connections) — `apps/backend/src/services/inventory.service.ts`
- **.checkLowStock()** (3 connections) — `apps/backend/src/services/inventory.service.ts`
- *... and 13 more nodes in this community*

## Relationships

- [Backend CRM & Complaint Handlers](Backend_CRM_&_Complaint_Handlers.md) (7 shared connections)
- [Backend Routing & Health Controllers](Backend_Routing_&_Health_Controllers.md) (7 shared connections)
- [Platform Compliance & Fraud Detection](Platform_Compliance_&_Fraud_Detection.md) (4 shared connections)
- [Backend: Controller Commission](Backend-_Controller_Commission.md) (2 shared connections)
- [Supabase Client & Auth Policies](Supabase_Client_&_Auth_Policies.md) (2 shared connections)
- [Backend: Order Controller](Backend-_Order_Controller.md) (1 shared connections)

## Source Files

- `apps/backend/src/controllers/inventory.controller.ts`
- `apps/backend/src/repositories/inventory.repository.ts`
- `apps/backend/src/services/inventory.service.ts`
- `apps/backend/src/types/inventory.ts`
- `apps/backend/src/validators/inventory.schema.ts`

## Audit Trail

- EXTRACTED: 93 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*