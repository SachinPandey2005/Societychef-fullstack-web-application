# Backend: Cart Repository

> 27 nodes · cohesion 0.17

## Key Concepts

- **.createOrderFromCart()** (13 connections) — `apps/backend/src/services/order.service.ts`
- **pricing.service.ts** (13 connections) — `apps/backend/src/services/pricing.service.ts`
- **CartRepository** (11 connections) — `apps/backend/src/repositories/cart.repository.ts`
- **.addDishToCart()** (11 connections) — `apps/backend/src/services/cart.service.ts`
- **CartService** (9 connections) — `apps/backend/src/services/cart.service.ts`
- **.getDishById()** (9 connections) — `apps/backend/src/services/dish.service.ts`
- **CartItem** (9 connections) — `apps/backend/src/types/cart.ts`
- **.removeItem()** (8 connections) — `apps/backend/src/services/cart.service.ts`
- **cart.repository.ts** (7 connections) — `apps/backend/src/repositories/cart.repository.ts`
- **.findOrCreateCart()** (7 connections) — `apps/backend/src/repositories/cart.repository.ts`
- **.calculateTotals()** (7 connections) — `apps/backend/src/services/pricing.service.ts`
- **.clearCart()** (6 connections) — `apps/backend/src/services/cart.service.ts`
- **.updateItemQuantity()** (6 connections) — `apps/backend/src/services/cart.service.ts`
- **.getCartItems()** (5 connections) — `apps/backend/src/repositories/cart.repository.ts`
- **.getCart()** (5 connections) — `apps/backend/src/services/cart.service.ts`
- **DeliveryMode** (5 connections) — `apps/backend/src/types/order.ts`
- **.findCartItemById()** (4 connections) — `apps/backend/src/repositories/cart.repository.ts`
- **.updateCartKitchen()** (4 connections) — `apps/backend/src/repositories/cart.repository.ts`
- **.updateItemQuantity()** (4 connections) — `apps/backend/src/repositories/cart.repository.ts`
- **cart.ts** (4 connections) — `apps/backend/src/types/cart.ts`
- **.addItem()** (3 connections) — `apps/backend/src/repositories/cart.repository.ts`
- **.findCartItem()** (3 connections) — `apps/backend/src/repositories/cart.repository.ts`
- **PricingService** (3 connections) — `apps/backend/src/services/pricing.service.ts`
- **Cart** (3 connections) — `apps/backend/src/types/cart.ts`
- **.clearCartItems()** (2 connections) — `apps/backend/src/repositories/cart.repository.ts`
- *... and 2 more nodes in this community*

## Relationships

- [Backend Middleware & Ownership Guards](Backend_Middleware_&_Ownership_Guards.md) (19 shared connections)
- [Backend: Cart Controller](Backend-_Cart_Controller.md) (6 shared connections)
- [Backend: Dish Repository](Backend-_Dish_Repository.md) (4 shared connections)
- [User Profiles & Admin Bootstrap](User_Profiles_&_Admin_Bootstrap.md) (3 shared connections)
- [Supabase Client & Auth Policies](Supabase_Client_&_Auth_Policies.md) (2 shared connections)
- [Backend: Repository Campaign](Backend-_Repository_Campaign.md) (2 shared connections)
- [Backend: Kitchen Createkitchen](Backend-_Kitchen_Createkitchen.md) (2 shared connections)
- [Backend: Order Repository](Backend-_Order_Repository.md) (2 shared connections)
- [Backend: Chat Controller](Backend-_Chat_Controller.md) (1 shared connections)
- [Backend: Dish Controller](Backend-_Dish_Controller.md) (1 shared connections)
- [Backend: Order Controller](Backend-_Order_Controller.md) (1 shared connections)
- [Backend: Updateassignmentstatus Deliveryservice](Backend-_Updateassignmentstatus_Deliveryservice.md) (1 shared connections)

## Source Files

- `apps/backend/src/repositories/cart.repository.ts`
- `apps/backend/src/services/cart.service.ts`
- `apps/backend/src/services/dish.service.ts`
- `apps/backend/src/services/order.service.ts`
- `apps/backend/src/services/pricing.service.ts`
- `apps/backend/src/types/cart.ts`
- `apps/backend/src/types/order.ts`

## Audit Trail

- EXTRACTED: 104 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*