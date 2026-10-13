# Delivery App: Delivery Config

> 9 nodes · cohesion 0.31

## Key Concepts

- **DevPhoneAuthService** (7 connections) — `apps/delivery/services/devPhoneAuth.ts`
- **devPhoneAuth.ts** (6 connections) — `apps/delivery/services/devPhoneAuth.ts`
- **.isDevAuthEnabled()** (5 connections) — `apps/delivery/services/devPhoneAuth.ts`
- **.shouldSkipOtpSend()** (3 connections) — `apps/delivery/services/devPhoneAuth.ts`
- **.validateDevOtp()** (3 connections) — `apps/delivery/services/devPhoneAuth.ts`
- **delivery/config/index.ts** (2 connections) — `apps/delivery/config/index.ts`
- **CONFIG** (2 connections) — `apps/delivery/config/index.ts`
- **.getFixedOtpCode()** (1 connections) — `apps/delivery/services/devPhoneAuth.ts`
- **FIXED_DEV_OTP** (1 connections) — `apps/delivery/services/devPhoneAuth.ts`

## Relationships

- [Delivery UI Micro-Animations](Delivery_UI_Micro-Animations.md) (3 shared connections)
- [Delivery Rider Auth & Onboarding Flow](Delivery_Rider_Auth_&_Onboarding_Flow.md) (3 shared connections)
- [Delivery Partner Bank & Leaderboard](Delivery_Partner_Bank_&_Leaderboard.md) (2 shared connections)

## Source Files

- `apps/delivery/config/index.ts`
- `apps/delivery/services/devPhoneAuth.ts`

## Audit Trail

- EXTRACTED: 19 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*