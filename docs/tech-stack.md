# HomeChef Tech Stack

## Product Direction

HomeChef is a real mobile marketplace product, not a web mockup. All new product work should target the React Native app in `apps/mobile` unless explicitly requested otherwise.

## Recommended MVP Stack

### Mobile

- React Native with Expo SDK 54.
- TypeScript.
- Expo New Architecture enabled.
- Expo Application Services for Android and iOS builds.
- Expo Router should be added when route count grows beyond the current hand-rolled navigation shell.

### Backend

- Supabase for MVP backend.
- Supabase Auth for phone OTP.
- Postgres for relational marketplace data.
- Supabase Realtime for chat and order status updates.
- Supabase Storage later for kitchen, dish, document, and hygiene images.

### Payments

- Razorpay for India payments.
- The app must never mark payment successful only from client callback.
- Required flow:
  1. Backend creates Razorpay order.
  2. App opens Razorpay checkout.
  3. App receives payment callback.
  4. Backend verifies signature.
  5. Backend marks order paid and creates settlement ledger rows.

### State and Data

- Start with local React state for the first working app skeleton.
- Add TanStack Query when real API calls begin.
- Add Zustand only if cross-screen local state becomes cumbersome.
- Keep domain types explicit: kitchens, dishes, menus, orders, settlements, campaigns, chats, supplies.

### Styling

- Current app uses React Native `StyleSheet` to avoid dependency overhead while core product flows are forming.
- NativeWind can be introduced after screens stabilize if utility styling improves speed.

## Initial App Modules

- Auth and role selection.
- Consumer discovery, filters, checkout, orders, rewards, chat.
- Chef onboarding, profile privacy, menu management, weekly menu, order management, settlements, supplies.
- Operations dashboard, trust/compliance, analytics.

## Near-Term Build Priorities

1. Convert local state to Supabase schema and API calls.
2. Implement phone OTP with Supabase.
3. Implement chef onboarding and menu persistence.
4. Implement consumer discovery from database queries.
5. Implement order lifecycle.
6. Integrate Razorpay through backend verification.
7. Add push notifications for order events.
