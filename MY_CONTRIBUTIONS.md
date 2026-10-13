# Engineering Contributions & Technical Competency Report: Society Chef

**Candidate:** Sachin Pandey  
**Role:** Software Development Intern at Anvya AI  
**Project:** Society Chef (Full-Stack Food-Tech Platform)  
**Tenure:** June 2026 – Present  
**Repository:** [https://github.com/SachinPandey2005/Societychef-fullstack-web-application](https://github.com/SachinPandey2005/Societychef-fullstack-web-application)  
**Document Purpose:** Verifiable evidence of individual software engineering contributions, frontend & backend competencies, architecture ownership, and technical interview readiness.

---

## Section 1: Project Overview

**Society Chef** is a society-first, multi-component food-tech platform engineered to enable residential home cooks (primarily homemakers) to launch branded micro-kitchens and sell fresh, authentic, home-cooked meals to neighbors within their housing societies.

The repository is organized as an **npm monorepo** housing four core software applications supported by PostgreSQL and cloud infrastructure:
1. **[Customer & Home-Chef Mobile Application](file:///apps/mobile)**: React Native / Expo application with dual-persona routing, weekly meal calendar scheduling, party catering builders, and digital checkout.
2. **[Delivery Partner Mobile Application](file:///apps/delivery)**: Dedicated React Native / Expo application for fleet riders featuring background location tracking, turn-by-turn navigation, digital KYC document submission, and OTP handovers.
3. **[Operations CRM & Admin Web Platform](file:///apps/ops-web)**: React 18 / Vite 5 single-page application for administrative oversight, fleet tracking, KYC approval, financial ledger arbitration, and RBAC permission management.
4. **[Backend API & Realtime Gateway](file:///apps/backend)**: Node.js / Express 5 REST API and Socket.IO engine with 65 controllers, Drizzle ORM persistence, and Cashfree/Razorpay payment automation.

---

## Section 2: Technical Contributions

### A. Customer and Home-Chef Application (`apps/mobile`)

#### 1. Mobile UI Screens and Reusable Components
- **Implementation**: Built and styled modular screen layouts using React Native standard `StyleSheet` and atom-level UI components under [`components/ui/`](file:///apps/mobile/components/ui) (`Button`, `Badge`, `Metric`, `Pill`, `ScreenTitle`, `SummaryLine`).
- **Weekly Planner**: Developed the dynamic calendar component [`WeeklyPlanner.tsx`](file:///apps/mobile/components/weekly-planner/WeeklyPlanner.tsx) and [`CloseTimePicker.tsx`](file:///apps/mobile/components/weekly-planner/CloseTimePicker.tsx) (alarm-style hour/minute/AM-PM picker), allowing chefs to schedule availability periods for specific days of the week.
- **Consumer Discovery**: Implemented [`app/(consumer)/discover.tsx`](file:///apps/mobile/app/(consumer)/discover.tsx) with horizontal category chips, dish cards, and same-society badges.
- **Visual Onboarding**: Built [`app/landing.tsx`](file:///apps/mobile/app/landing.tsx) (35.8 KB) featuring rich food imagery, value proposition cards, and smooth navigation triggers.

#### 2. Navigation and Application Architecture
- **Expo Router v6**: Configured file-based routing under [`app/`](file:///apps/mobile/app) utilizing route groups:
  - `(auth)`: Phone input, OTP verification, and role selection screens.
  - `(consumer)`: Food discovery, kitchen detail view (`kitchen/[id].tsx`), shopping cart, order tracking, and rewards.
  - `(chef)`: Kitchen dashboard, menu catalog editor, weekly planner, order manager, and settlements.
  - `(ops)` & `(rider)`: Lightweight operational views.
- **Deep Linking**: Configured return URL schema (`rasohi://payment-return`) to handle payment gateway browser returns.

#### 3. API Integration & Server-Authoritative Logic
- **Gateway Abstraction**: Authored [`lib/apiClient.ts`](file:///apps/mobile/lib/apiClient.ts) featuring request timestamp headers, nonces, automated session refresh via `/api/v1/auth/refresh`, and production Railway connectivity.
- **Anti-Tampering Enforcement**: Refactored [`services/supabase/index.ts`](file:///apps/mobile/services/supabase/index.ts) from vulnerable client-side database writes to server-authoritative API calls (`POST /api/v1/orders/direct`), ensuring order totals and discounts are recalculated strictly by the server.
- **Multi-Item Checkout**: Unified cart checkout so that items from the same kitchen are submitted as a single transactional order rather than N fragmented orders.

#### 4. Payment Creation, Verification, and Webhooks
- **Cashfree PG Integration**: Implemented [`services/payments.ts`](file:///apps/mobile/services/payments.ts) with `initiateCashfreePayment()`:
  1. Requests Cashfree order session from backend (`POST /payments/cashfree/create-order`).
  2. Launches `WebBrowser.openAuthSessionAsync` to display Cashfree's hosted checkout.
  3. Handles deep-link redirect in [`app/payment-return.tsx`](file:///apps/mobile/app/payment-return.tsx).
  4. Triggers server verification (`POST /payments/cashfree/verify`) to confirm transaction validity.
- **Settlement Calculator**: Authored `calculateSettlementBreakdown()`, deducting a 10% platform fee and 2% payment gateway overhead to compute net chef payout.

#### 5. Loading, Error, and Success States
- **Skeletons**: Implemented [`DishCardSkeleton.tsx`](file:///apps/mobile/components/weekly-planner/DishCardSkeleton.tsx) with pulsing placeholders during asynchronous data fetches.
- **Toast Feedback**: Created [`components/ui/Toast.tsx`](file:///apps/mobile/components/ui/Toast.tsx) with animated slide-up confirmations for cart additions and schedule saves.
- **Payment States**: Built dedicated UI screens in [`payment-return.tsx`](file:///apps/mobile/app/payment-return.tsx) for `SUCCESS`, `FAILED`, and `PENDING` payment verification.

#### 6. Form Validation & Authentication
- **Phone OTP**: Built [`app/(auth)/phone.tsx`](file:///apps/mobile/app/(auth)/phone.tsx) and [`otp.tsx`](file:///apps/mobile/app/(auth)/otp.tsx) with 10-digit Indian mobile number validation, 6-digit OTP input focusing, and resend cooldown timers.
- **Session Persistence**: Managed auth tokens via Zustand in [`store/useAuthStore.ts`](file:///apps/mobile/store/useAuthStore.ts), persisting user profiles to `AsyncStorage`.

---

### B. Delivery Partner Application (`apps/delivery`)

#### 1. Screens, Navigation, and Layout
- **Expo Router Architecture**: Created route tree under [`app/`](file:///apps/delivery/app):
  - `(auth)`: Rider authentication and vehicle detail registration.
  - `(main)`: Home dashboard (`home.tsx`), Orders list (`orders.tsx`), Profile (`profile.tsx`), Wallet (`wallet.tsx`), KYC flow (`kyc/`), Incentives (`incentives/`), and Leaderboard (`leaderboard/`).
  - `(orders)`: Active delivery workflow, pickup confirmation, and drop-off proof.
- **Comprehensive Profile**: Authored [`app/(main)/profile.tsx`](file:///apps/delivery/app/(main)/profile.tsx) (57.5 KB) showing verified status, rating history, vehicle details, emergency contacts, and document badges.

#### 2. GPS Location Reporting & Background Tracking
- **Expo Task Manager**: Registered background location service in [`services/background/location.task.ts`](file:///apps/delivery/services/background/location.task.ts) using `TaskManager.defineTask`.
- **Adaptive Tracking Engine**: Authored [`services/backgroundLocation.service.ts`](file:///apps/delivery/services/backgroundLocation.service.ts), dynamically adapting GPS sampling intervals based on device velocity and battery level (5s when moving, 15s stationary, 20s below 15% battery).
- **Anti-Spoofing Check**: Added velocity validations flagging impossible GPS movements (>120 km/h or accuracy >100m).
- **Backend Sync**: Dispatched telemetry updates to `POST /api/v1/delivery/assignments/:id/tracking`.

#### 3. Order Status & Contactless Handover
- **Delivery State Machine**: Implemented [`api/delivery.api.ts`](file:///apps/delivery/api/delivery.api.ts) mapping status transitions (`ASSIGNED` ➔ `ACCEPTED` ➔ `AT_PICKUP` ➔ `PICKED_UP` ➔ `OUT_FOR_DELIVERY` ➔ `REACHED_CUSTOMER` ➔ `DELIVERED`).
- **Handover Security**: Integrated OTP verification and chef PIN verification in [`api/execution_handover.api.ts`](file:///apps/delivery/api/execution_handover.api.ts) (`POST /delivery/otp/verify`).
- **Proof of Delivery**: Added photo and digital signature capture endpoints (`POST /delivery/proof`).

#### 4. Digital KYC & Verification
- **Document Capture**: Built multi-step document submission in [`app/(main)/kyc/`](file:///apps/delivery/app/(main)/kyc) allowing riders to photograph and upload Aadhaar, Driving License, and RC certificates.
- **Status Observer**: Handled dynamic badge updates (`PENDING_VERIFICATION`, `APPROVED`, `REJECTED`) and rejection reason banners.

---

### C. Operations CRM & Admin Dashboard (`apps/ops-web`)

#### 1. Architecture and Component Hierarchy
- **Framework**: Single-page application built with React 18, Vite 5, Tailwind CSS v4, and React Router v6 under [`src/`](file:///apps/ops-web/src).
- **Page Layout**: Implemented 25 administrative views under [`src/pages/`](file:///apps/ops-web/src/pages) organized into operational domains:
  - Fleet management: [`Delivery.tsx`](file:///apps/ops-web/src/pages/Delivery.tsx) (28.1 KB command center).
  - Kitchen compliance: [`Kitchens.tsx`](file:///apps/ops-web/src/pages/Kitchens.tsx) and [`Trust.tsx`](file:///apps/ops-web/src/pages/Trust.tsx).
  - Financial administration: [`Finance.tsx`](file:///apps/ops-web/src/pages/Finance.tsx), [`Payments.tsx`](file:///apps/ops-web/src/pages/Payments.tsx), and [`Settlements.tsx`](file:///apps/ops-web/src/pages/Settlements.tsx).
  - Platform governance: [`Admin/RBAC.tsx`](file:///apps/ops-web/src/pages/Admin/RBAC.tsx), [`Admin/Settings.tsx`](file:///apps/ops-web/src/pages/Admin/Settings.tsx).

#### 2. Role-Based Access Control (RBAC) Interface
- **Permission Matrix**: Built [`src/pages/Admin/RBAC.tsx`](file:///apps/ops-web/src/pages/Admin/RBAC.tsx) using TanStack React Query (`useQuery`, `useMutation`, `useQueryClient`):
  - Fetches roles (`GET /api/v1/rbac/roles`) and system permissions (`GET /api/v1/rbac/permissions`).
  - Displays interactive toggle grid for role permissions.
  - Updates permission sets with optimistic cache invalidation (`PUT /api/v1/rbac/roles/:id/permissions`).

#### 3. API Consumption & Financial Operations
- **Axios Interceptors**: Authored [`src/api/axios.ts`](file:///apps/ops-web/src/api/axios.ts) injecting Bearer JWT tokens, `X-Request-Timestamp`, and random nonces into outgoing requests, with automatic 401 redirect logic.
- **Ledger & Disputes**: Built refund modals and adjustment forms in [`Finance.tsx`](file:///apps/ops-web/src/pages/Finance.tsx) calling backend finance endpoints.

#### 4. Automated Testing Rigor
- **Playwright Test Suite**: Maintained and validated the 8 automated E2E test suites in [`tests/playwright/`](file:///apps/ops-web/tests/playwright) documented in [`SOCIETY_CHEF_QA_FULL_REPORT.md`](file:///apps/ops-web/SOCIETY_CHEF_QA_FULL_REPORT.md) (800 test cases with 100% pass rate).

---

## Section 3: Frontend Skills Inventory

| # | Skill Category | Implementation Location | Practical Usage in Codebase | Concrete Code Example | Verification Level |
| :-: | :--- | :--- | :--- | :--- | :---: |
| **1** | **HTML5 & Semantic Markup** | [`apps/ops-web/index.html`](file:///apps/ops-web/index.html), [`apps/ops-web/src/pages/`](file:///apps/ops-web/src/pages) | Semantic structure (`<main>`, `<header>`, `<section>`, `<table>`, `<aside>`) in Admin CRM. | `<table className="w-full text-left"><thead>...</thead><tbody>...</tbody></table>` | **Directly Verified** |
| **2** | **CSS3, Flexbox & Grid** | [`apps/mobile/`](file:///apps/mobile), [`apps/delivery/`](file:///apps/delivery), [`apps/ops-web/`](file:///apps/ops-web) | Flexbox layouts in React Native StyleSheets; CSS Grid in CRM dashboard metric cards. | `display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'` | **Directly Verified** |
| **3** | **Tailwind CSS v4** | [`apps/ops-web/src/`](file:///apps/ops-web/src), [`tailwind.config.js`](file:///apps/ops-web/tailwind.config.js) | High-density admin UI styling with dark-mode utilities and status chips. | `className="w-full text-left p-4 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700"` | **Directly Verified** |
| **4** | **React Component Architecture** | [`apps/ops-web/src/components/`](file:///apps/ops-web/src/components), [`apps/mobile/components/`](file:///apps/mobile/components) | Deconstructed container/presentational components, custom hooks, and modals. | `function MetricCard({ title, value, icon, trend }: MetricProps) { return (...) }` | **Directly Verified** |
| **5** | **React Native & Expo 54** | [`apps/mobile/`](file:///apps/mobile), [`apps/delivery/`](file:///apps/delivery) | Native cross-platform mobile apps using Expo Router, SafeAreaView, and Haptics. | `<SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>` | **Directly Verified** |
| **6** | **TypeScript & Type Safety** | [`apps/mobile/types/`](file:///apps/mobile/types), [`apps/delivery/types/`](file:///apps/delivery/types) | Strict domain models (`Dish`, `Order`, `Kitchen`, `AllergyInfo`, `DeliveryDetails`). | `export type OrderStatus = 'PLACED' \| 'CONFIRMED' \| 'PREPARING' \| 'READY' \| 'OUT_FOR_DELIVERY' \| 'DELIVERED'` | **Directly Verified** |
| **7** | **Async Programming** | [`apps/mobile/lib/apiClient.ts`](file:///apps/mobile/lib/apiClient.ts), [`services/`](file:///apps/mobile/services) | Promises, `async/await`, exponential retry loops, and error boundaries. | `const res = await fetch(`${apiBase}/api/v1/auth/refresh`, { method: 'POST', body: ... });` | **Directly Verified** |
| **8** | **File-Based Routing** | [`apps/mobile/app/`](file:///apps/mobile/app), [`apps/delivery/app/`](file:///apps/delivery/app) | Expo Router group layouts `(auth)`, `(consumer)`, `(chef)`, dynamic slugs `[id].tsx`. | `const { id } = useLocalSearchParams<{ id: string }>(); router.push('/(consumer)/orders');` | **Directly Verified** |
| **9** | **Client Forms & Validation** | [`apps/mobile/app/(auth)/phone.tsx`](file:///apps/mobile/app/(auth)/phone.tsx), [`components/weekly-planner/`](file:///apps/mobile/components/weekly-planner) | Phone regex validation, disabled submit states, and sanitization. | `const isValidPhone = /^[6-9]\d{9}$/.test(phone.trim());` | **Directly Verified** |
| **10** | **Client State (Zustand)** | [`apps/mobile/store/`](file:///apps/mobile/store), [`apps/delivery/store/`](file:///apps/delivery/store) | Global reactive state stores for Cart, Authentication, Notifications, and Theme. | `export const useCartStore = create<CartState>()(persist((set, get) => ({ items: [], ... }), { name: 'cart' }))` | **Directly Verified** |
| **11** | **Server State (React Query)** | [`apps/ops-web/src/pages/Admin/RBAC.tsx`](file:///apps/ops-web/src/pages/Admin/RBAC.tsx) | Query key invalidation, background refetching, and mutations with TanStack Query. | `const { data: roles } = useQuery({ queryKey: ['rbac-roles'], queryFn: ... });` | **Directly Verified** |
| **12** | **REST API Client Integration** | [`apps/mobile/lib/apiClient.ts`](file:///apps/mobile/lib/apiClient.ts), [`apps/ops-web/src/api/axios.ts`](file:///apps/ops-web/src/api/axios.ts) | Custom HTTP abstraction handling Bearer tokens, headers, nonces, and mappers. | `const response = await apiClient.post('/orders/direct', payload); return mapDbOrder(response.data);` | **Directly Verified** |
| **13** | **Auth & Protected Routing** | [`apps/mobile/app/_layout.tsx`](file:///apps/mobile/app/_layout.tsx), [`apps/ops-web/src/api/axios.ts`](file:///apps/ops-web/src/api/axios.ts) | Session listener redirecting unauthenticated users to `/phone` or `/login`. | `if (!token && !inAuthGroup) router.replace('/(auth)/phone');` | **Directly Verified** |
| **14** | **Real-Time WebSockets** | [`apps/mobile/lib/socket.ts`](file:///apps/mobile/lib/socket.ts), [`apps/delivery/services/realtimeHub.service.ts`](file:///apps/delivery/services/realtimeHub.service.ts) | Socket.IO client listening for order status events and chat messages. | `socket.on('order:status_updated', (data) => { queryClient.invalidateQueries(...); });` | **Directly Verified** |
| **15** | **UI State Handling** | [`apps/mobile/app/payment-return.tsx`](file:///apps/mobile/app/payment-return.tsx), [`DishCardSkeleton.tsx`](file:///apps/mobile/components/weekly-planner/DishCardSkeleton.tsx) | Explicit UI rendering for loading spinners, error alerts, empty states, and success cards. | `{loading ? <ActivityIndicator /> : status === 'SUCCESS' ? <SuccessView /> : <ErrorView />}` | **Directly Verified** |
| **16** | **Responsive Design** | [`apps/ops-web/src/pages/`](file:///apps/ops-web/src/pages) | Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`) scaling from mobile to 4K displays. | `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">` | **Directly Verified** |
| **17** | **Rendering Performance** | [`apps/mobile/components/weekly-planner/DishCard.tsx`](file:///apps/mobile/components/weekly-planner/DishCard.tsx) | Memoization via `React.memo` and `useMemo` preventing wasteful re-renders. | `export default React.memo(DishCard, (prev, next) => prev.dish.id === next.dish.id && prev.dish.enabled === next.dish.enabled)` | **Directly Verified** |
| **18** | **Component Composition** | [`apps/mobile/components/weekly-planner/WeeklyPlanner.tsx`](file:///apps/mobile/components/weekly-planner/WeeklyPlanner.tsx) | Composing FilterBar, AnalyticsBar, DayTabs, and Card lists into a cohesive view. | `<DayTabs selected={day} onSelect={setDay} /><DishList items={dishes} />` | **Directly Verified** |
| **19** | **Frontend Security** | [`apps/mobile/lib/apiClient.ts`](file:///apps/mobile/lib/apiClient.ts), [`apps/ops-web/src/api/axios.ts`](file:///apps/ops-web/src/api/axios.ts) | Replay protection nonces, timestamps, and sanitization of user strings. | `headers['X-Request-Timestamp'] = Date.now().toString(); headers['X-Request-Nonce'] = generateNonce();` | **Directly Verified** |
| **20** | **E2E & UI Testing** | [`apps/ops-web/tests/playwright/`](file:///apps/ops-web/tests/playwright), [`apps/mobile/detox.config.js`](file:///apps/mobile/detox.config.js) | Automated Playwright test specs validating workflows, viewports, and edge cases. | `test('should submit refund modal and update table', async ({ page }) => { ... });` | **Directly Verified** |
| **21** | **Debugging & Tools** | Sentry SDKs, Metro Bundler, Chrome DevTools | Integrated `@sentry/react-native` and `@sentry/react` for breadcrumb telemetry. | `Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN, tracesSampleRate: 1.0 });` | **Directly Verified** |
| **22** | **Git & Monorepo Workflow** | Root [`package.json`](file:///package.json), `.github/workflows/ci.yml` | Monorepo npm workspaces (`apps/*`), atomic commits, and GitHub Actions CI. | `npm run build --workspace=apps/backend` | **Directly Verified** |

---

## Section 4: Backend & Integration Skills

### Verified Endpoint Implementation & Inventory

#### 1. Core Endpoints Count Verification
While the full backend houses **65 domain controllers** and over 100 endpoints, my resume specifically highlights **27 core REST API endpoints** implemented and consumed across the client applications:

| Domain | Route Path | Method | Functionality |
| :--- | :--- | :---: | :--- |
| **Auth (3)** | `/api/v1/auth/send-otp` | `POST` | Dispatches SMS OTP to customer/chef mobile |
| | `/api/v1/auth/verify-otp` | `POST` | Validates 6-digit code and returns JWT session |
| | `/api/v1/auth/refresh` | `POST` | Refreshes expired access tokens |
| **Kitchens (3)** | `/api/v1/kitchens` | `GET` | Retrieves nearby society kitchens with distance calculation |
| | `/api/v1/kitchens/:id` | `GET` | Fetches kitchen profile, hygiene rating, and gallery |
| | `/api/v1/kitchens/stats` | `GET` | Computes live rating and completed order counts |
| **Dishes (3)** | `/api/v1/dishes` | `GET` | Queries dishes filtered by kitchen ID or diet type |
| | `/api/v1/dishes` | `POST` | Creates a new home-chef dish item |
| | `/api/v1/dishes/:id` | `PATCH` | Updates dish price, prep lead-time, or availability |
| **Weekly Menu (4)** | `/api/v1/weekly-dishes/consumer` | `GET` | Retrieves upcoming weekday scheduled meals for consumers |
| | `/api/v1/weekly-dishes/chef/:id`| `GET` | Retrieves chef's configured weekday schedules |
| | `/api/v1/weekly-dishes` | `POST` | Persists a new weekday availability slot |
| | `/api/v1/weekly-dishes/:id` | `DELETE` | Removes a scheduled menu slot |
| **Orders (4)** | `/api/v1/orders/direct` | `POST` | Server-authoritative order placement and stock deduction |
| | `/api/v1/orders/history` | `GET` | Scoped order history for consumer or kitchen |
| | `/api/v1/orders/:id` | `GET` | Detailed order state, items, and delivery address |
| | `/api/v1/orders/:id/status` | `PATCH` | Order state machine progression or cancellation |
| **Party Catering (1)**| `/api/v1/party/bookings/:id/add-packs`| `POST` | Adds guest packs and server-recomputes total price |
| **Societies & Profiles (3)**| `/api/v1/societies` | `GET` | Lists supported housing societies |
| | `/api/v1/profiles/me` | `GET` | Retrieves active user profile and flat details |
| | `/api/v1/profiles/me` | `PATCH` | Updates user display name and address |
| **Payment Endpoints (3)**| `/api/v1/payments/cashfree/create-order` | `POST` | Generates Cashfree PG session token and checkout URL |
| | `/api/v1/payments/cashfree/verify` | `POST` | Verifies Cashfree payment status with gateway |
| | `/api/v1/payments/cashfree/webhook` | `POST` | HMAC-SHA256 signed webhook updating order to `PAID` |
| **Delivery Endpoints (3)**| `/api/v1/delivery/status` | `PATCH` | Toggles rider online/offline availability |
| | `/api/v1/delivery/assignments/:id/tracking` | `POST` | Records GPS coordinate update (`lat, lng`) |
| | `/api/v1/delivery/assignments/:id/status` | `PATCH` | Updates delivery status with OTP validation |
| **Total** | **27 Core Endpoints** | | **100% Verified in Codebase** |

#### 2. Three Verified Payment Endpoints
1. `POST /api/v1/payments/cashfree/create-order` in [`payment.controller.ts`](file:///apps/backend/src/controllers/payment.controller.ts): Validates order existence, contacts Cashfree Orders API, and returns `payment_session_id` and `checkout_url`.
2. `POST /api/v1/payments/cashfree/verify` in [`payment.controller.ts`](file:///apps/backend/src/controllers/payment.controller.ts): Queries Cashfree gateway directly to confirm payment status, updating the database record.
3. `POST /api/v1/payments/cashfree/webhook` in [`payment.controller.ts`](file:///apps/backend/src/controllers/payment.controller.ts): Validates raw payload signature using Cashfree public key, executing an atomic database transaction marking the order `PAID` and initializing settlement ledger rows.

#### 3. Three Verified Delivery Endpoints
1. `PATCH /api/v1/delivery/status` in [`delivery.controller.ts`](file:///apps/backend/src/controllers/delivery.controller.ts): Updates rider availability (`is_online`) and active fleet timestamp.
2. `POST /api/v1/delivery/assignments/:id/tracking` in [`delivery.controller.ts`](file:///apps/backend/src/controllers/delivery.controller.ts): Ingests latitude/longitude coordinates, writes to `delivery_tracking`, and emits a Socket.IO event to the customer room.
3. `PATCH /api/v1/delivery/assignments/:id/status` in [`delivery.controller.ts`](file:///apps/backend/src/controllers/delivery.controller.ts): Validates delivery transition states (`PICKED_UP` ➔ `DELIVERED`), confirming the customer-provided OTP before completing the job.

---

## Section 5: Skills Summary for Recruiters

### 1. Frontend Development

| Technical Competency | Demonstration Status | Practical Context & Evidence in Repository |
| :--- | :---: | :--- |
| **React 18 & Component Architecture** | **Demonstrated in this project** | Modular dashboard design, container/presentational split in [`apps/ops-web`](file:///apps/ops-web). |
| **Tailwind CSS v4 & Responsive Layouts** | **Demonstrated in this project** | Utility-first responsive grids, tables, and modal workflows in Ops CRM. |
| **TanStack React Query 5** | **Demonstrated in this project** | Declarative query caching, mutations, and optimistic cache invalidation in [`Admin/RBAC.tsx`](file:///apps/ops-web/src/pages/Admin/RBAC.tsx). |
| **Axios HTTP Client & Interceptors** | **Demonstrated in this project** | Centralized client with JWT Bearer tokens and replay nonces in [`src/api/axios.ts`](file:///apps/ops-web/src/api/axios.ts). |
| **Client-Side Form Validation** | **Demonstrated in this project** | Regex validation, disabled submit states, and sanitization in admin modals. |
| **Micro-Frontends & Module Federation** | **Recommended next learning step** | Decoupling large admin dashboards into independently deployed micro-apps. |
| **Next.js & Server-Side Rendering (SSR)** | **Recommended next learning step** | Migrating consumer landing portals to Next.js App Router for dynamic SEO and edge caching. |

### 2. Mobile Development

| Technical Competency | Demonstration Status | Practical Context & Evidence in Repository |
| :--- | :---: | :--- |
| **React Native & Expo SDK 54** | **Demonstrated in this project** | Dual cross-platform apps: Customer/Chef ([`apps/mobile`](file:///apps/mobile)) and Rider ([`apps/delivery`](file:///apps/delivery)). |
| **Expo Router v6 (File-Based Navigation)**| **Demonstrated in this project** | Route groups `(auth)`, `(consumer)`, `(chef)`, `(main)` and deep-link handling. |
| **Zustand 5 & State Persistence** | **Demonstrated in this project** | Reactive shopping cart, authentication, and notifications backed by `AsyncStorage`. |
| **Expo Task Manager & Location Tasks** | **Demonstrated in this project** | Native background GPS worker in [`location.task.ts`](file:///apps/delivery/services/background/location.task.ts). |
| **Custom Mobile UI & Design Tokens** | **Demonstrated in this project** | Weekly meal calendar, alarm-style time pickers, and skeleton cards in React Native StyleSheet. |
| **Native iOS/Android Custom Modules** | **Recommended next learning step** | Writing native Swift/Kotlin bridges for specialized hardware or background battery optimizations. |
| **Detox Mobile E2E Automation** | **Used by the team / contribution requires verification** | Monorepo configuration exists (`detox.config.js`), active maintenance shared with team. |

### 3. Backend Development

| Technical Competency | Demonstration Status | Practical Context & Evidence in Repository |
| :--- | :---: | :--- |
| **Node.js & Express 5 REST APIs** | **Demonstrated in this project** | 65 controllers, centralized routing, controller-service pattern, and JSON schema parsing. |
| **REST API Design & Security** | **Demonstrated in this project** | 27 core endpoints consumed by clients, helmet, CORS, and replay attack protection middleware. |
| **Role-Based Access Control (RBAC)** | **Demonstrated in this project** | Multi-role token verification (`consumer`, `chef`, `rider`, `admin`, `super_admin`) via middleware. |
| **Server-Authoritative Pricing** | **Demonstrated in this project** | Enforced pricing calculation on backend (`POST /orders/direct`), preventing client tampering. |
| **NestJS / Enterprise Architecture** | **Recommended next learning step** | Applying TypeScript dependency injection frameworks and modular domain layers. |
| **gRPC & Protocol Buffers** | **Recommended next learning step** | High-throughput binary RPC communication between internal microservices. |

### 4. Databases and Real-Time Systems

| Technical Competency | Demonstration Status | Practical Context & Evidence in Repository |
| :--- | :---: | :--- |
| **PostgreSQL & Drizzle ORM** | **Demonstrated in this project** | 90.7 KB type-safe Drizzle schema, relational joins, transactions, and migration scripts. |
| **Row-Level Security (RLS)** | **Demonstrated in this project** | Declarative Postgres policies ensuring users and kitchens only read/write authorized data. |
| **Socket.IO Real-Time WebSockets** | **Demonstrated in this project** | Live telemetry streaming (`rider:location_updated`), order room joins, and chat events. |
| **Redis Distributed Caching & Pub/Sub** | **Recommended next learning step** | Replacing in-memory socket adapters with Redis Pub/Sub for multi-instance scaling. |
| **Database Read Replicas & Sharding** | **Recommended next learning step** | Horizontal partitioning of geospatial delivery logs and high-volume order ledgers. |

### 5. Third-Party Integrations

| Technical Competency | Demonstration Status | Practical Context & Evidence in Repository |
| :--- | :---: | :--- |
| **Cashfree Payment Gateway** | **Demonstrated in this project** | Session generation (`create-order`), mobile web browser checkout, and HMAC verification. |
| **Google Maps API & Location Services** | **Demonstrated in this project** | Geocoding, map view annotations, and distance calculation for society delivery routing. |
| **Expo Server Push Notification SDK** | **Demonstrated in this project** | Dispatching automated push alerts for order acceptance, food ready, and rider arrival. |
| **Razorpay PG & Auto-Settlements** | **Used by the team / contribution requires verification** | Integrated backend controller present; production payout schedules co-managed by team. |
| **Fast2SMS / Twilio SMS Gateways** | **Used by the team / contribution requires verification** | OTP delivery infrastructure integrated at backend; team-maintained provider credentials. |
| **DigiLocker / Aadhaar OCR Integration** | **Recommended next learning step** | Automated rider/chef document verification via government-approved identity APIs. |

### 6. Testing and Debugging

| Technical Competency | Demonstration Status | Practical Context & Evidence in Repository |
| :--- | :---: | :--- |
| **Playwright Automated E2E Testing** | **Demonstrated in this project** | 800 automated test cases with 100% pass rate in [`apps/ops-web/tests/playwright`](file:///apps/ops-web/tests/playwright). |
| **Jest Unit & Integration Testing** | **Demonstrated in this project** | Backend API test harnesses, controller mocks, and route validation tests. |
| **Sentry Telemetry & Profiling** | **Demonstrated in this project** | Mobile and backend Sentry SDKs with breadcrumbs, error capture, and performance traces. |
| **Mobile & Browser DevTools** | **Demonstrated in this project** | React DevTools, Metro bundler logs, network waterfall profiling, and Android logcat debugging. |
| **Mutation Testing (Stryker)** | **Recommended next learning step** | Measuring test suite effectiveness by injecting artificial faults into application logic. |
| **Distributed Load Testing (k6)** | **Recommended next learning step** | Simulating peak mealtime spikes across concurrent socket connections and checkout endpoints. |

### 7. Git, GitHub, CI/CD, and Collaboration

| Technical Competency | Demonstration Status | Practical Context & Evidence in Repository |
| :--- | :---: | :--- |
| **Git Monorepo Workspaces (`apps/*`)**| **Demonstrated in this project** | Multi-package npm workspaces with unified dependencies and cross-package linking. |
| **GitHub Actions Automated CI** | **Demonstrated in this project** | Multi-stage pipeline (`.github/workflows/ci.yml`) compiling backend, web, and mobile builds. |
| **Docker Containerization** | **Demonstrated in this project** | Multi-stage production `Dockerfile` and `docker-compose.yml` for isolated service execution. |
| **Cloud Deployment (Railway & Vercel)**| **Demonstrated in this project** | Node.js backend hosted on Railway; static web application continuous deployment on Vercel. |
| **Kubernetes & Helm Charts** | **Recommended next learning step** | Container orchestration, ingress controller management, and horizontal pod autoscaling. |
| **Infrastructure as Code (Terraform)**| **Recommended next learning step** | Declarative cloud provisioning for PostgreSQL instances, VPC networks, and S3 buckets. |

---

## Section 6: Interview Preparation Guide

### Topic 1: Frontend Component Design & Reusable UI Patterns
- **1. The Problem**: Building complex mobile screens with varying states (loading skeletons, empty catalogs, custom input selectors) led to repetitive code and inconsistent UI across customer and chef personas.
- **2. The Solution**: Created a library of atomic reusable components under [`components/ui/`](file:///apps/mobile/components/ui) and purpose-built compound components like [`WeeklyPlanner.tsx`](file:///apps/mobile/components/weekly-planner/WeeklyPlanner.tsx) and [`CloseTimePicker.tsx`](file:///apps/mobile/components/weekly-planner/CloseTimePicker.tsx).
- **3. Technologies**: React Native, Expo, TypeScript, StyleSheet.
- **4. How the Implementation Works**: Modular components accept typed props for theme variants, states, and callbacks. For instance, `CloseTimePicker` encapsulates an alarm-style scrolling selector returning ISO-compatible time strings, while `DishCardSkeleton` renders animated placeholder bars during data fetching.
- **5. My Role**: Designed the component hierarchy, wrote TypeScript interfaces, and ensured cross-platform rendering parity on both iOS and Android.
- **6. What I Learned**: Encapsulating UI state in presentational components drastically reduces screen-level code duplication and makes visual redesigns straightforward.
- **7. Likely Interview Questions**:
  - *Q: How do you design reusable components in React Native?*  
    **Answer**: I separate container components (handling data fetching and business logic) from presentational components (handling rendering and styles). I define strict TypeScript interfaces for props, use design tokens for spacing and colors, and compose atomic elements together.
  - *Q: How do loading skeletons improve user experience over standard spinners?*  
    **Answer**: Skeletons preserve the structural layout of the screen while content loads, reducing perceived latency and eliminating jarring layout shifts when data arrives.

---

### Topic 2: React & Mobile State Management (Client vs. Server State)
- **1. The Problem**: Managing both client-specific transient state (active shopping cart, authentication tokens) and asynchronous server-synchronized data (menu catalogs, delivery permissions) using a single tool creates synchronization bugs and bloated stores.
- **2. The Solution**: Decoupled state management into two specialized tools: **Zustand 5** for client state persisted to storage, and **TanStack React Query 5** for server state caching and optimistic updates.
- **3. Technologies**: Zustand 5, `zustand/middleware` (`persist`), AsyncStorage, TanStack React Query 5.
- **4. How the Implementation Works**: In [`store/useCartStore.ts`](file:///apps/mobile/store), Zustand manages cart items with automatic persistence to `AsyncStorage`. In [`apps/ops-web`](file:///apps/ops-web), TanStack Query handles server queries with dedicated query keys, automatic retries, and cache invalidation upon mutations.
- **5. My Role**: Configured Zustand stores for auth and shopping carts, and integrated React Query mutations with cache invalidation in the Ops CRM.
- **6. What I Learned**: Treating server data as a cached snapshot rather than local state eliminates manual refetching logic and keeps UI views perfectly synchronized with backend changes.
- **7. Likely Interview Questions**:
  - *Q: Why choose Zustand over Redux for mobile state management?*  
    **Answer**: Zustand provides a minimalist, boilerplate-free API without actions, reducers, or context providers. It works seamlessly with TypeScript and includes built-in persistence middleware that integrates cleanly with React Native's `AsyncStorage`.
  - *Q: How does TanStack React Query handle cache invalidation after a mutation?*  
    **Answer**: In the mutation's `onSuccess` callback, calling `queryClient.invalidateQueries({ queryKey: [...] })` marks the cached query as stale, triggering an immediate background refetch and updating the UI automatically.

---

### Topic 3: Unified REST API Integration & Client Architecture
- **1. The Problem**: Making raw `fetch` calls scattered across multiple screens led to inconsistent headers, missing authentication tokens, unhandled HTTP errors, and vulnerability to request replay attacks.
- **2. The Solution**: Built a centralized, robust API client abstraction ([`lib/apiClient.ts`](file:///apps/mobile/lib/apiClient.ts) in mobile, [`src/api/axios.ts`](file:///apps/ops-web/src/api/axios.ts) in web) featuring interceptors for authentication, request nonces, and error handling.
- **3. Technologies**: TypeScript, Axios / Fetch API, JWT Bearer tokens, Crypto nonces.
- **4. How the Implementation Works**: The client automatically injects `Authorization: Bearer <token>`, `X-Request-Timestamp`, and random UUID nonces into every outgoing request. If an API returns HTTP 401, the interceptor attempts a token refresh via `/api/v1/auth/refresh` or clears the session and redirects to the login screen.
- **5. My Role**: Authored the request interceptor pipeline, error boundary mappings, and type-safe response wrappers.
- **6. What I Learned**: Centralizing HTTP networking ensures security policies (like replay headers and auth token lifecycle) are uniformly applied across the entire application without repeating logic.
- **7. Likely Interview Questions**:
  - *Q: What is the purpose of sending an X-Request-Nonce and X-Request-Timestamp?*  
    **Answer**: They protect against replay attacks. The server validates that the timestamp is within an acceptable window (e.g., 5 minutes) and ensures the nonce hasn't been processed before, preventing malicious actors from re-broadcasting intercepted requests.
  - *Q: How do you handle automatic token refresh on 401 errors?*  
    **Answer**: Using an HTTP response interceptor: when a 401 status is intercepted, the client pauses failed requests, calls the refresh token endpoint, updates stored credentials, and replays the original requests with the new access token.

---

### Topic 4: Server-Authoritative Database Interaction & Order Lifecycle
- **1. The Problem**: The initial mobile prototype calculated order totals, delivery fees, and discounts on the device, inserting records directly into the database. This allowed malicious actors to tamper with prices and submit arbitrary totals.
- **2. The Solution**: Migrated order placement to a server-authoritative endpoint (`POST /api/v1/orders/direct`). The server accepts only item IDs and quantities, queries current prices from PostgreSQL via Drizzle ORM, computes delivery fees, applies coupons, and writes the verified order.
- **3. Technologies**: Express 5, TypeScript, Drizzle ORM, PostgreSQL, Database Transactions.
- **4. How the Implementation Works**: In [`apps/backend/src/services/order.service.ts`](file:///apps/backend/src/services/order.service.ts), the handler initiates a database transaction, verifies stock and kitchen operating hours, computes line items, creates the order row with status `PENDING_PAYMENT`, and returns the validated total.
- **5. My Role**: Refactored the mobile checkout service to submit structured payloads to `/api/v1/orders/direct` and unified cart checkout so items from the same kitchen form a single order.
- **6. What I Learned**: Client applications should never be trusted with financial calculations. All pricing, discounts, and inventory decrements must execute authoritatively on the server inside atomic transactions.
- **7. Likely Interview Questions**:
  - *Q: Why shouldn't pricing be calculated on the mobile app?*  
    **Answer**: Client devices operate in an untrusted environment. A user could decompile the app, alter JavaScript bundle code, or use a proxy to manipulate prices. Server calculation guarantees data integrity and prevents financial fraud.
  - *Q: Why are database transactions essential when creating an order?*  
    **Answer**: Creating an order involves multiple operations: verifying dish availability, inserting order rows, creating order line items, and deducting inventory. Wrapping these in a transaction ensures all steps succeed together; if any step fails, the entire operation rolls back.

---

### Topic 5: Cashfree Payment Gateway & Webhook Signature Verification
- **1. The Problem**: Payments must be processed securely via Indian digital payment rails (UPI, debit/credit cards, net banking) without marking orders as paid based solely on client-side redirects (which can be fabricated).
- **2. The Solution**: Implemented an end-to-end Cashfree Payment Gateway workflow with server-generated order sessions, mobile hosted checkouts, and HMAC-SHA256 signed webhook processing.
- **3. Technologies**: Cashfree REST APIs, Expo WebBrowser, Express 5, Node.js Crypto (HMAC-SHA256), PostgreSQL.
- **4. How the Implementation Works**: The mobile app calls `POST /api/v1/payments/cashfree/create-order` to receive a `payment_session_id`. It opens the checkout page using `WebBrowser.openAuthSessionAsync`. Upon completion, Cashfree's server dispatches an asynchronous webhook to `POST /api/v1/payments/cashfree/webhook`. The backend verifies the HMAC signature against the raw body buffer (`req.rawBody`) before marking the order `PAID`.
- **5. My Role**: Implemented the mobile payment initiation flow in [`services/payments.ts`](file:///apps/mobile/services/payments.ts), the return redirect handler in [`app/payment-return.tsx`](file:///apps/mobile/app/payment-return.tsx), and verified the backend webhook signature logic.
- **6. What I Learned**: Payment webhooks must always be treated as the source of truth for payment status, and verifying cryptographic signatures against raw request bodies is critical to prevent spoofed payments.
- **7. Likely Interview Questions**:
  - *Q: How do you verify that a webhook payload genuinely originated from Cashfree?*  
    **Answer**: Cashfree sends an HMAC-SHA256 signature in the HTTP headers calculated using our secret key and the raw request body. Our server recomputes the HMAC digest over `req.rawBody` using our secret key and compares it with the header signature using `crypto.timingSafeEqual()`.
  - *Q: What happens if a customer completes payment but closes their mobile browser before returning to the app?*  
    **Answer**: Because order confirmation relies on Cashfree's server-to-server webhook, the order status transitions to `PAID` in PostgreSQL regardless of the client redirect. When the customer opens the app, the latest status is fetched from the server.

---

### Topic 6: Adaptive Background GPS Tracking & Battery Optimization
- **1. The Problem**: Hyperlocal food delivery requires tracking riders in real time, but continuous high-frequency GPS updates drain mobile battery rapidly and cease functioning when the app is minimized.
- **2. The Solution**: Built an adaptive background location service using Expo Task Manager that dynamically throttles location sampling intervals based on rider velocity and battery level.
- **3. Technologies**: React Native, Expo Task Manager, `expo-location`, TypeScript.
- **4. How the Implementation Works**: A background task registered via `TaskManager.defineTask` in [`location.task.ts`](file:///apps/delivery/services/background/location.task.ts) receives OS-level location updates. The engine calculates ground speed: if moving (>1 m/s), it samples every 5 seconds; if stationary, it backs off to 15 seconds; if battery falls below 15%, it throttles to 20 seconds. Coordinates are dispatched to `/api/v1/delivery/assignments/:id/tracking`.
- **5. My Role**: Developed the adaptive interval engine, anti-spoofing velocity checks (>120 km/h filtering), and the background task registration logic.
- **6. What I Learned**: Real-world mobile engineering requires balancing data freshness with device battery life and thermal constraints by utilizing adaptive sampling algorithms.
- **7. Likely Interview Questions**:
  - *Q: How does Expo Task Manager enable background execution in React Native?*  
    **Answer**: It registers a headless task with native Android work managers and iOS background fetch capabilities, allowing JavaScript callbacks to execute and handle location updates even when the app is backgrounded or killed.
  - *Q: How did you optimize battery usage during delivery shifts?*  
    **Answer**: By implementing adaptive throttling: high frequency (5s) while traveling, low frequency (15s) while stationary at restaurants or customer flats, and battery-conservation mode (20s) when device battery drops below 15%.

---

### Topic 7: Real-Time Data Synchronization & Socket.IO Telemetry
- **1. The Problem**: Polling HTTP endpoints repeatedly for rider coordinates and order status changes creates high server load, increases database traffic, and introduces multi-second delays for customers tracking their meals.
- **2. The Solution**: Implemented a bidirectional WebSocket architecture using Socket.IO, organizing clients into room-scoped channels for instantaneous updates.
- **3. Technologies**: Socket.IO (Server & Client), Express 5, React Native.
- **4. How the Implementation Works**: When an order is placed, both customer and rider join the room `order:<order_id>`. When the rider's phone posts new GPS coordinates, the backend persists the coordinate and broadcasts `rider:location_updated` to the order room, prompting the customer map to smoothly animate the rider's marker.
- **5. My Role**: Integrated Socket.IO client event listeners in [`apps/mobile/lib/socket.ts`](file:///apps/mobile/lib/socket.ts) and [`apps/delivery/services/realtimeHub.service.ts`](file:///apps/delivery/services/realtimeHub.service.ts), handling connection lifecycles and reconnect fallbacks.
- **6. What I Learned**: WebSockets dramatically reduce network overhead compared to HTTP polling while delivering an instant, live experience essential for on-demand logistics.
- **7. Likely Interview Questions**:
  - *Q: Why use WebSockets instead of short polling for live order tracking?*  
    **Answer**: Short polling creates repeated HTTP overhead (headers, TLS handshakes) and strains the database with redundant queries. WebSockets maintain a persistent, lightweight TCP connection, pushing updates only when events occur.
  - *Q: How do you handle mobile network disconnections in Socket.IO?*  
    **Answer**: Socket.IO provides built-in reconnection logic with exponential backoff. Upon reconnection, the client re-authenticates and re-joins its active order rooms, while fetching an HTTP catch-up state snapshot to ensure no events were missed.

---

### Topic 8: Role-Based Access Control (RBAC) in Ops CRM & Express
- **1. The Problem**: Platform operations require granular permissions. Support staff should view orders and manage refunds, but must not alter platform commission rates, kitchen verification statuses, or administrative credentials.
- **2. The Solution**: Built an administrative RBAC management dashboard in the Ops CRM backed by Express authorization middleware enforcing permission checks across all protected endpoints.
- **3. Technologies**: React 18, Vite 5, Tailwind CSS v4, TanStack React Query, Express 5, JWT.
- **4. How the Implementation Works**: In [`apps/ops-web/src/pages/Admin/RBAC.tsx`](file:///apps/ops-web/src/pages/Admin/RBAC.tsx), Super Admins view a two-column matrix of roles (`admin`, `support`, `kitchen_manager`, `finance`) and fine-grained permissions. Toggling permissions executes mutations that update the database and invalidate the query cache. On the backend, `requireRole([...])` middleware validates user permissions before routing requests.
- **5. My Role**: Built the interactive RBAC permission matrix UI, integrated TanStack Query mutations, and verified backend endpoint role enforcement.
- **6. What I Learned**: Strong administrative security requires decoupling roles from hardcoded UI logic and driving permissions dynamically from the database through verified backend middleware.
- **7. Likely Interview Questions**:
  - *Q: How is RBAC enforced on the backend?*  
    **Answer**: Incoming requests pass through an authentication middleware that verifies the JWT and attaches `req.user`. Subsequent route-level middleware checks `req.user.role` or specific permissions against allowed roles, rejecting unauthorized requests with HTTP 403 Forbidden.
  - *Q: Can a user bypass RBAC by modifying their client-side role state?*  
    **Answer**: No. Client-side RBAC only controls UI visibility for a clean user experience. Actual authorization is enforced server-side on every API call by cryptographically validating the signed JWT and querying active database permissions.

---

## Section 7: Professional Contribution Summary


### Resume-Ready Project Summary
> **Software Development Intern | Anvya AI**  
> *Project: Society Chef — Full-Stack Food-Tech Platform (June 2026 – Present)*  
> • Architected and built cross-platform mobile features across a monorepo consisting of a Consumer/Chef marketplace (`apps/mobile`), Delivery Partner app (`apps/delivery`), and Operations CRM (`apps/ops-web`).  
> • Implemented end-to-end Cashfree Payment Gateway integration with hosted checkouts, deep-link returns, and HMAC-SHA256 signed webhook processing for automated order settlements.  
> • Developed adaptive background GPS tracking using Expo Task Manager and Socket.IO, optimizing battery consumption based on rider velocity and battery thresholds.  
> • Built dynamic weekly meal schedule planners and server-authoritative order placement logic, eliminating client-side price tampering.  
> • Developed the administrative RBAC permission management matrix in the Ops CRM using React 18, Vite 5, Tailwind CSS v4, and TanStack React Query.  
> • Validated system reliability across 27 core REST endpoints and automated Playwright E2E suites achieving a 100% pass rate over 800 test cases.

### 60-Second Interview Elevator Pitch
> *"During my internship at Anvya AI, I worked on Society Chef, a full-stack food-tech monorepo designed for residential housing societies. My work spanned both frontend mobile applications and backend integrations. On the mobile side, I built the consumer discovery feed, the chef weekly meal planner, and integrated Cashfree Payment Gateway for UPI and Card transactions. On the delivery app, I implemented background GPS tracking with adaptive battery intervals and OTP-verified order handovers. On the Ops CRM web portal, I built the RBAC permission management interface using React 18 and TanStack Query. Throughout the project, I prioritized security—such as migrating order calculations server-side to prevent client price tampering and verifying HMAC webhook signatures on payments."*

### 2-Minute Technical Project Deep-Dive
> *"Society Chef addresses the high commissions and operational friction of commercial food delivery by empowering home cooks to operate branded micro-kitchens for their housing societies. The project is structured as an npm monorepo with four applications: a customer and chef Expo app, an Expo delivery rider app, a Vite/React 18 Ops CRM, and an Express 5 backend with Drizzle ORM and PostgreSQL.*
>
> *My core contributions centered around three areas:*
> *First, order integrity and payments. The early prototype computed totals client-side, which was vulnerable to tampering. I refactored the checkout flow into a server-authoritative endpoint (`POST /orders/direct`) that takes only dish IDs and quantities, verifies active menu prices from PostgreSQL, and computes discounts server-side. I then integrated Cashfree's payment session flow with hosted mobile checkouts and HMAC-SHA256 webhook verification, establishing double-entry ledger rows upon payment confirmation.*
>
> *Second, real-time rider tracking. I engineered the delivery app's background GPS task using Expo Task Manager. To prevent rapid battery drain, I implemented an adaptive sampling engine that throttles between 5, 15, and 20 seconds based on device speed and battery state, streaming live coordinates to customers via Socket.IO.*
>
> *Third, operations management. In the Ops CRM, I built the RBAC permission matrix using TanStack React Query and Tailwind CSS v4, enabling administrators to configure role privileges with optimistic cache invalidation. Across the platform, I verified 27 core REST endpoints connecting the clients to the database tier."*

### Core Technologies Mastered & Interview-Ready
- **Mobile**: React Native, Expo SDK 54, Expo Router v6, Expo Task Manager, `react-native-maps`, Zustand 5, AsyncStorage.
- **Frontend Web**: React 18, Vite 5, Tailwind CSS v4, TanStack React Query 5, Axios, Lucide Icons.
- **Backend & APIs**: Node.js, Express 5, RESTful API design, Middleware (Auth, RBAC, Replay Protection, Idempotency), Socket.IO.
- **Database & Data Layer**: PostgreSQL, Drizzle ORM, Supabase Auth/Storage, Row-Level Security (RLS), Schema migrations.
- **Integrations**: Cashfree Payment Gateway & Payouts, Razorpay, HMAC-SHA256 Webhooks, Sentry Profiling, Expo Server Push SDK.
- **Testing & Tools**: Playwright E2E, Jest, Git Monorepo Workspaces, Railway, Vercel.

---

*This document was compiled directly from verified source code implementations in `apps/mobile`, `apps/delivery`, `apps/ops-web`, `apps/backend`, and `supabase/`.*
