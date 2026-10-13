# Backend: Accounting Repository

> 14 nodes · cohesion 0.24

## Key Concepts

- **accounting.repository.ts** (8 connections) — `apps/backend/src/repositories/accounting.repository.ts`
- **accounting.ts** (6 connections) — `apps/backend/src/types/accounting.ts`
- **AccountingRepository** (5 connections) — `apps/backend/src/repositories/accounting.repository.ts`
- **AccountingService** (5 connections) — `apps/backend/src/services/accounting.service.ts`
- **.postJournalEntry()** (4 connections) — `apps/backend/src/repositories/accounting.repository.ts`
- **.postRevenueJournal()** (4 connections) — `apps/backend/src/services/accounting.service.ts`
- **JournalEntry** (4 connections) — `apps/backend/src/types/accounting.ts`
- **.getJournalEntries()** (3 connections) — `apps/backend/src/repositories/accounting.repository.ts`
- **.recordTax()** (3 connections) — `apps/backend/src/repositories/accounting.repository.ts`
- **JournalLine** (3 connections) — `apps/backend/src/types/accounting.ts`
- **TaxRecord** (3 connections) — `apps/backend/src/types/accounting.ts`
- **.init()** (2 connections) — `apps/backend/src/services/accounting.service.ts`
- **AccountType** (1 connections) — `apps/backend/src/types/accounting.ts`
- **LedgerAccount** (1 connections) — `apps/backend/src/types/accounting.ts`

## Relationships

- [Platform Compliance & Fraud Detection](Platform_Compliance_&_Fraud_Detection.md) (3 shared connections)
- [Backend: Finance Controller](Backend-_Finance_Controller.md) (3 shared connections)
- [Supabase Client & Auth Policies](Supabase_Client_&_Auth_Policies.md) (2 shared connections)

## Source Files

- `apps/backend/src/repositories/accounting.repository.ts`
- `apps/backend/src/services/accounting.service.ts`
- `apps/backend/src/types/accounting.ts`

## Audit Trail

- EXTRACTED: 30 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*