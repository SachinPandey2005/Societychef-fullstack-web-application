# Backend: Dish Repository

> 18 nodes · cohesion 0.22

## Key Concepts

- **DishService** (14 connections) — `apps/backend/src/services/dish.service.ts`
- **dish.repository.ts** (8 connections) — `apps/backend/src/repositories/dish.repository.ts`
- **DishRepository** (7 connections) — `apps/backend/src/repositories/dish.repository.ts`
- **.updateDish()** (7 connections) — `apps/backend/src/services/dish.service.ts`
- **.update()** (6 connections) — `apps/backend/src/repositories/dish.repository.ts`
- **Dish** (6 connections) — `apps/backend/src/types/dish.ts`
- **dish.ts** (5 connections) — `apps/backend/src/types/dish.ts`
- **CreateDishInput** (5 connections) — `apps/backend/src/types/dish.ts`
- **UpdateDishInput** (5 connections) — `apps/backend/src/types/dish.ts`
- **.create()** (4 connections) — `apps/backend/src/repositories/dish.repository.ts`
- **.delete()** (4 connections) — `apps/backend/src/repositories/dish.repository.ts`
- **.createDish()** (4 connections) — `apps/backend/src/services/dish.service.ts`
- **.deleteDish()** (4 connections) — `apps/backend/src/services/dish.service.ts`
- **.findAll()** (3 connections) — `apps/backend/src/repositories/dish.repository.ts`
- **.findById()** (3 connections) — `apps/backend/src/repositories/dish.repository.ts`
- **.archiveDish()** (3 connections) — `apps/backend/src/services/dish.service.ts`
- **.getAllDishes()** (3 connections) — `apps/backend/src/services/dish.service.ts`
- **.toggleAvailability()** (3 connections) — `apps/backend/src/services/dish.service.ts`

## Relationships

- [Backend Middleware & Ownership Guards](Backend_Middleware_&_Ownership_Guards.md) (10 shared connections)
- [Backend: Dish Controller](Backend-_Dish_Controller.md) (7 shared connections)
- [Backend: Cart Repository](Backend-_Cart_Repository.md) (4 shared connections)
- [Supabase Client & Auth Policies](Supabase_Client_&_Auth_Policies.md) (2 shared connections)
- [Backend: Chat Controller](Backend-_Chat_Controller.md) (1 shared connections)

## Source Files

- `apps/backend/src/repositories/dish.repository.ts`
- `apps/backend/src/services/dish.service.ts`
- `apps/backend/src/types/dish.ts`

## Audit Trail

- EXTRACTED: 59 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*