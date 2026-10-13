# Backend: Getzonedashboard Geographyservice

> 6 nodes · cohesion 0.33

## Key Concepts

- **GeographyService** (4 connections) — `apps/backend/src/services/geography.service.ts`
- **RegionalConfigService** (3 connections) — `apps/backend/src/services/regional_config.service.ts`
- **.getSettings()** (3 connections) — `apps/backend/src/services/regional_config.service.ts`
- **.getZoneDashboard()** (2 connections) — `apps/backend/src/controllers/regional_ops.controller.ts`
- **.getFallbackZoneId()** (2 connections) — `apps/backend/src/services/geography.service.ts`
- **.resolveGeography()** (1 connections) — `apps/backend/src/services/geography.service.ts`

## Relationships

- [Platform Compliance & Fraud Detection](Platform_Compliance_&_Fraud_Detection.md) (3 shared connections)
- [Backend Routing & Health Controllers](Backend_Routing_&_Health_Controllers.md) (2 shared connections)

## Source Files

- `apps/backend/src/controllers/regional_ops.controller.ts`
- `apps/backend/src/services/geography.service.ts`
- `apps/backend/src/services/regional_config.service.ts`

## Audit Trail

- EXTRACTED: 10 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*