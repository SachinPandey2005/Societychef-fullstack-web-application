# Project Progress

## Current State

### What's Built (Frontend UI & Router)
* **File-Based Routing**: Configured using `expo-router` under `apps/mobile/app/` with directories for `(auth)`, `(consumer)`, `(chef)`, and `(ops)`.
* **Custom UI Atoms**: Reusable layout components under `apps/mobile/components/ui/` (e.g., `Button`, `Badge`, `Metric`, `Pill`, `ScreenTitle`, `SummaryLine`).
* **Weekly Schedule Planner**: Chefs can select from enabled menu dishes, schedule available hours on specific days of the week, persist the schedules to memory, and manage deletions.
* **Consumer Kitchen Details**: Displays dynamic weekly availability schedules for each dish, automatically falling back to static availability strings when no entries are scheduled.
* **Complex Components**: Core elements such as `CheckoutModal`, `RateOrderModal`, and `ListingCard`.
* **Local State Management**: Handled via Zustand stores (persisted to local `AsyncStorage`) for client authentication caching, shopping cart operations, notification badges, reviews, and rewards data.

### What's Mocked
* **Service Layer**: The main api service gateway (`apps/mobile/services/index.ts`) resolves directly to `apps/mobile/services/mock/index.ts`. All fetch/mutation promises run with dummy delays to simulate latency.
* **Authentication**: Simulated OTP confirmation checks in `apps/mobile/app/(auth)/otp.tsx` where entering any code mock-signs in the user.
* **Data Fetching**: Screens use local React `useState` and `useEffect` triggers to manually call mock async promises. React Query hooks (`useQuery` / `useMutation`) are configured in root `_layout.tsx` but not used in any components.
* **Transactions & Payouts**: Razorpay order creations and bank validations are placeholders resolved via local dialog alerts.
* **Operational Actions**: Chat messaging exchanges and packaging supply marketplace carts are fully simulated in local memory.

### What's Connected to Supabase
* **Nothing**: The app is currently 100% mocked on the client side. Although `@supabase/supabase-js` is installed in `package.json` and a DB schema draft exists in `supabase/schema.sql`, there is no active Supabase client configuration or live database integration in the codebase.

---

## Known Issues
* **No Database Sync**: Application states do not persist between devices or app reloads beyond local client-side `AsyncStorage` and in-memory mock variables.
* **React Query Standby**: The configuration for TanStack Query is initialized but goes unused across all app views.
* **No Push Notifications**: Required notification features in `tech-stack.md` are not yet connected.

---

## Recently Completed
* **Weekly Planner Dynamic Flow**: Implemented end-to-end data schedule configurations from chef inputs to in-memory persistence and dynamic rendering on consumer kitchen details pages.
* Built the initial Expo Router configuration shell and route screens.
* Setup local Zustand state modules to persist dummy user data.
* Created static schema SQL representations for the Supabase backend database.
