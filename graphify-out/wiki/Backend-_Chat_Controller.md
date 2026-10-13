# Backend: Chat Controller

> 32 nodes · cohesion 0.12

## Key Concepts

- **chat.controller.ts** (19 connections) — `apps/backend/src/controllers/chat.controller.ts`
- **orders_sync.test.ts** (18 connections) — `apps/backend/tests/unit/services/orders_sync.test.ts`
- **chat.service.ts** (16 connections) — `apps/backend/src/services/chat.service.ts`
- **realtime.service.ts** (12 connections) — `apps/backend/src/services/realtime.service.ts`
- **chat.repository.ts** (9 connections) — `apps/backend/src/repositories/chat.repository.ts`
- **ChatRepository** (9 connections) — `apps/backend/src/repositories/chat.repository.ts`
- **RealtimeService** (9 connections) — `apps/backend/src/services/realtime.service.ts`
- **ChatService** (8 connections) — `apps/backend/src/services/chat.service.ts`
- **chat.schema.ts** (7 connections) — `apps/backend/src/validators/chat.schema.ts`
- **.createMessage()** (5 connections) — `apps/backend/src/repositories/chat.repository.ts`
- **Conversation** (5 connections) — `apps/backend/src/types/chat.ts`
- **getMessages** (4 connections) — `apps/backend/src/controllers/chat.controller.ts`
- **markAsRead** (4 connections) — `apps/backend/src/controllers/chat.controller.ts`
- **sendMessage** (4 connections) — `apps/backend/src/controllers/chat.controller.ts`
- **sendSupportMessage** (4 connections) — `apps/backend/src/controllers/chat.controller.ts`
- **sendTyping** (4 connections) — `apps/backend/src/controllers/chat.controller.ts`
- **.sendSupportMessage()** (4 connections) — `apps/backend/src/services/chat.service.ts`
- **chat.ts** (4 connections) — `apps/backend/src/types/chat.ts`
- **Message** (4 connections) — `apps/backend/src/types/chat.ts`
- **.findOrCreateSupportConversation()** (3 connections) — `apps/backend/src/repositories/chat.repository.ts`
- **.getMessages()** (3 connections) — `apps/backend/src/repositories/chat.repository.ts`
- **.markMessagesAsRead()** (3 connections) — `apps/backend/src/services/chat.service.ts`
- **CreateMessageInput** (3 connections) — `apps/backend/src/types/chat.ts`
- **.getConversationById()** (2 connections) — `apps/backend/src/repositories/chat.repository.ts`
- **.markMessagesAsRead()** (2 connections) — `apps/backend/src/repositories/chat.repository.ts`
- *... and 7 more nodes in this community*

## Relationships

- [Backend Middleware & Ownership Guards](Backend_Middleware_&_Ownership_Guards.md) (21 shared connections)
- [Backend CRM & Complaint Handlers](Backend_CRM_&_Complaint_Handlers.md) (7 shared connections)
- [Backend Routing & Health Controllers](Backend_Routing_&_Health_Controllers.md) (7 shared connections)
- [Supabase Client & Auth Policies](Supabase_Client_&_Auth_Policies.md) (4 shared connections)
- [Backend: Kitchen Createkitchen](Backend-_Kitchen_Createkitchen.md) (4 shared connections)
- [Backend: Repository Campaign](Backend-_Repository_Campaign.md) (4 shared connections)
- [Backend: Service Controller](Backend-_Service_Controller.md) (4 shared connections)
- [Backend: Controller Commission](Backend-_Controller_Commission.md) (2 shared connections)
- [Platform Compliance & Fraud Detection](Platform_Compliance_&_Fraud_Detection.md) (2 shared connections)
- [Backend: Order Repository](Backend-_Order_Repository.md) (2 shared connections)
- [User Profiles & Admin Bootstrap](User_Profiles_&_Admin_Bootstrap.md) (2 shared connections)
- [Backend: Order Controller](Backend-_Order_Controller.md) (1 shared connections)

## Source Files

- `apps/backend/src/controllers/chat.controller.ts`
- `apps/backend/src/repositories/chat.repository.ts`
- `apps/backend/src/services/chat.service.ts`
- `apps/backend/src/services/realtime.service.ts`
- `apps/backend/src/types/chat.ts`
- `apps/backend/src/validators/chat.schema.ts`
- `apps/backend/tests/unit/services/orders_sync.test.ts`

## Audit Trail

- EXTRACTED: 120 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*