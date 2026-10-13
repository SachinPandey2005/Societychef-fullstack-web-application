# HomeChef

Mobile-first marketplace prototype for society-based home kitchens.

The product helps interested home cooks quickly launch a branded kitchen for their society, publish dishes and weekly menus, and receive paid or promotional orders from nearby residents.

## Current State

- Detailed product requirements are in `docs/requirements.md`.
- The production mobile app starts in `apps/mobile`.
- Technical stack direction is in `docs/tech-stack.md`.
- Backend schema draft starts in `supabase/schema.sql`.

## Run Mobile App

```powershell
cd apps/mobile
npm start
```

For web preview:

```powershell
cd apps/mobile
npx expo start --web --localhost --port 19006
```

## Core Experiences

- Phone + OTP based entry.
- Chef onboarding with kitchen name, society, flat privacy, dish selection, suggested prices, custom dishes, bank settlement placeholder.
- Consumer discovery by dish, society, distance, delivery time, and price.
- Society discount, free weekly dish, free sampling, and challenge unlock mechanics.
- Packing supplies and future delivery partner considerations captured in the requirements.
