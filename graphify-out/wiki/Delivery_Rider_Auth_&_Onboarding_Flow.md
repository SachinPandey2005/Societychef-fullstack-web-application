# Delivery Rider Auth & Onboarding Flow

> 58 nodes · cohesion 0.08

## Key Concepts

- **(main)/profile.tsx** (55 connections) — `apps/delivery/app/(main)/profile.tsx`
- **(auth)/onboarding.tsx** (45 connections) — `apps/delivery/app/(auth)/onboarding.tsx`
- **delivery/components/ui/Modal.tsx** (33 connections) — `apps/delivery/components/ui/Modal.tsx`
- **BankDetailsCard.tsx** (25 connections) — `apps/delivery/components/wallet/BankDetailsCard.tsx`
- **TextInput.tsx** (24 connections) — `apps/delivery/components/ui/TextInput.tsx`
- **useAuthStore** (23 connections) — `apps/delivery/store/useAuthStore.ts`
- **Modal()** (22 connections) — `apps/delivery/components/ui/Modal.tsx`
- **ChefPinVerifyModal.tsx** (18 connections) — `apps/delivery/components/handover/ChefPinVerifyModal.tsx`
- **EmergencySosModal.tsx** (16 connections) — `apps/delivery/components/dashboard/EmergencySosModal.tsx`
- **PayoutRequestModal.tsx** (16 connections) — `apps/delivery/components/wallet/PayoutRequestModal.tsx`
- **StatementDownloadModal.tsx** (16 connections) — `apps/delivery/components/wallet/StatementDownloadModal.tsx`
- **OnboardingScreen()** (15 connections) — `apps/delivery/app/(auth)/onboarding.tsx`
- **usePartnerStore** (15 connections) — `apps/delivery/store/usePartnerStore.ts`
- **ProfileScreen()** (14 connections) — `apps/delivery/app/(main)/profile.tsx`
- **TextInput()** (12 connections) — `apps/delivery/components/ui/TextInput.tsx`
- **delivery/app/index.tsx** (11 connections) — `apps/delivery/app/index.tsx`
- **wallet/index.ts** (11 connections) — `apps/delivery/components/wallet/index.ts`
- **uploadFileToStorage()** (10 connections) — `apps/delivery/services/storage.service.ts`
- **useBankStore** (10 connections) — `apps/delivery/store/useBankStore.ts`
- **validation.ts** (10 connections) — `apps/delivery/utils/validation.ts`
- **useVehicleStore** (9 connections) — `apps/delivery/store/useVehicleStore.ts`
- **delivery/services/storage.service.ts** (8 connections) — `apps/delivery/services/storage.service.ts`
- **BankDetailsCard()** (7 connections) — `apps/delivery/components/wallet/BankDetailsCard.tsx`
- **validateAccountNumber()** (7 connections) — `apps/delivery/utils/validation.ts`
- **validateBankName()** (7 connections) — `apps/delivery/utils/validation.ts`
- *... and 33 more nodes in this community*

## Relationships

- [Delivery App Settings & Diagnostics](Delivery_App_Settings_&_Diagnostics.md) (81 shared connections)
- [Rider KYC Document Verification](Rider_KYC_Document_Verification.md) (58 shared connections)
- [Delivery Partner Bank & Leaderboard](Delivery_Partner_Bank_&_Leaderboard.md) (34 shared connections)
- [Delivery Order Execution & Details](Delivery_Order_Execution_&_Details.md) (25 shared connections)
- [Delivery OTP Handover & Order Proof](Delivery_OTP_Handover_&_Order_Proof.md) (14 shared connections)
- [Delivery UI Micro-Animations](Delivery_UI_Micro-Animations.md) (12 shared connections)
- [Delivery App: Wallet Apps](Delivery_App-_Wallet_Apps.md) (10 shared connections)
- [Database Schema & Migrations](Database_Schema_&_Migrations.md) (9 shared connections)
- [Delivery Partner API & Settlements](Delivery_Partner_API_&_Settlements.md) (5 shared connections)
- [Delivery App: Delivery Config](Delivery_App-_Delivery_Config.md) (3 shared connections)
- [Consumer & Chef Realtime Chat](Consumer_&_Chef_Realtime_Chat.md) (2 shared connections)
- [Rider Map Navigation & Tracking](Rider_Map_Navigation_&_Tracking.md) (2 shared connections)

## Source Files

- `apps/delivery/app/(auth)/login.tsx`
- `apps/delivery/app/(auth)/onboarding.tsx`
- `apps/delivery/app/(auth)/register.tsx`
- `apps/delivery/app/(main)/kyc/index.tsx`
- `apps/delivery/app/(main)/profile.tsx`
- `apps/delivery/app/index.tsx`
- `apps/delivery/components/dashboard/EmergencySosModal.tsx`
- `apps/delivery/components/handover/ChefPinVerifyModal.tsx`
- `apps/delivery/components/ui/Modal.tsx`
- `apps/delivery/components/ui/TextInput.tsx`
- `apps/delivery/components/wallet/BankDetailsCard.tsx`
- `apps/delivery/components/wallet/PayoutRequestModal.tsx`
- `apps/delivery/components/wallet/StatementDownloadModal.tsx`
- `apps/delivery/components/wallet/index.ts`
- `apps/delivery/services/storage.service.ts`
- `apps/delivery/store/useAuthStore.ts`
- `apps/delivery/store/useBankStore.ts`
- `apps/delivery/store/useDocumentStore.ts`
- `apps/delivery/store/useKYCStore.ts`
- `apps/delivery/store/usePartnerStore.ts`

## Audit Trail

- EXTRACTED: 387 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*