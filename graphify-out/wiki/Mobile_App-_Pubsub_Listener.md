# Mobile App: Pubsub Listener

> 16 nodes · cohesion 0.15

## Key Concepts

- **mock/partyService.ts** (21 connections) — `apps/mobile/services/mock/partyService.ts`
- **pubsub.ts** (6 connections) — `apps/mobile/lib/pubsub.ts`
- **pubsub** (5 connections) — `apps/mobile/lib/pubsub.ts`
- **placePartyOrder()** (4 connections) — `apps/mobile/services/supabase/partyService.ts`
- **sendPartyOrderPlacedNotificationToChef()** (3 connections) — `apps/mobile/services/notifications.ts`
- **mockChefOrders** (2 connections) — `apps/mobile/services/mock/index.ts`
- **mockOrders** (2 connections) — `apps/mobile/services/mock/index.ts`
- **placePartyOrder()** (2 connections) — `apps/mobile/services/mock/partyService.ts`
- **Listener** (1 connections) — `apps/mobile/lib/pubsub.ts`
- **.publish()** (1 connections) — `apps/mobile/lib/pubsub.ts`
- **.subscribe()** (1 connections) — `apps/mobile/lib/pubsub.ts`
- **DEFAULT_PARTY_MENU** (1 connections) — `apps/mobile/services/mock/partyService.ts`
- **getPartyKitchens()** (1 connections) — `apps/mobile/services/mock/partyService.ts`
- **getPartyMenu()** (1 connections) — `apps/mobile/services/mock/partyService.ts`
- **partyMenusStore** (1 connections) — `apps/mobile/services/mock/partyService.ts`
- **savePartyMenu()** (1 connections) — `apps/mobile/services/mock/partyService.ts`

## Relationships

- [Mobile App: Initial Chef](Mobile_App-_Initial_Chef.md) (5 shared connections)
- [Mobile Financial & Chef Registration](Mobile_Financial_&_Chef_Registration.md) (5 shared connections)
- [Chef Dashboard & Order Growth](Chef_Dashboard_&_Order_Growth.md) (3 shared connections)
- [Chef Dish Catalog & Menu Management](Chef_Dish_Catalog_&_Menu_Management.md) (3 shared connections)
- [Consumer & Chef Realtime Chat](Consumer_&_Chef_Realtime_Chat.md) (1 shared connections)

## Source Files

- `apps/mobile/lib/pubsub.ts`
- `apps/mobile/services/mock/index.ts`
- `apps/mobile/services/mock/partyService.ts`
- `apps/mobile/services/notifications.ts`
- `apps/mobile/services/supabase/partyService.ts`

## Audit Trail

- EXTRACTED: 35 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*