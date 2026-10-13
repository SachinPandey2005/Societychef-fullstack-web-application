# Database: Public Delivery

> 37 nodes · cohesion 0.08

## Key Concepts

- **20260805000001_database_hardening.sql** (25 connections) — `supabase/migrations/20260805000001_database_hardening.sql`
- **public.delivery_partners** (6 connections)
- **public.delivery_partner_location** (5 connections) — `supabase/migrations/20260805000001_database_hardening.sql`
- **public.audit_logs** (4 connections) — `supabase/migrations/20260805000001_database_hardening.sql`
- **public.pending_delivery_verifications** (4 connections) — `supabase/migrations/20260805000001_database_hardening.sql`
- **public.auto_assign_nearest_available_partner()** (3 connections) — `supabase/migrations/20260805000001_database_hardening.sql`
- **public.delivery_partner_wallet_summary** (3 connections) — `supabase/migrations/20260805000001_database_hardening.sql`
- **public.orders** (3 connections)
- **public.profiles** (3 connections)
- **public.wallet_transactions** (3 connections)
- **public.verification_requests** (2 connections)
- **idx_audit_logs_actor_id** (2 connections) — `supabase/migrations/20260805000001_database_hardening.sql`
- **idx_audit_logs_created_at** (2 connections) — `supabase/migrations/20260805000001_database_hardening.sql`
- **idx_delivery_partner_location_coords** (2 connections) — `supabase/migrations/20260805000001_database_hardening.sql`
- **idx_delivery_partner_location_partner_id_captured_at** (2 connections) — `supabase/migrations/20260805000001_database_hardening.sql`
- **idx_delivery_partners_kyc_status** (2 connections) — `supabase/migrations/20260805000001_database_hardening.sql`
- **idx_delivery_partners_status** (2 connections) — `supabase/migrations/20260805000001_database_hardening.sql`
- **idx_partner_documents_partner_type** (2 connections) — `supabase/migrations/20260805000001_database_hardening.sql`
- **idx_verification_requests_status** (2 connections) — `supabase/migrations/20260805000001_database_hardening.sql`
- **idx_wallet_transactions_created_at** (2 connections) — `supabase/migrations/20260805000001_database_hardening.sql`
- **idx_wallet_transactions_wallet_id** (2 connections) — `supabase/migrations/20260805000001_database_hardening.sql`
- **idx_wallets_user_role** (2 connections) — `supabase/migrations/20260805000001_database_hardening.sql`
- **public.calculate_wallet_balance()** (2 connections) — `supabase/migrations/20260805000001_database_hardening.sql`
- **public.delivery_partner_dashboard_view** (2 connections) — `supabase/migrations/20260805000001_database_hardening.sql`
- **public.wallets** (2 connections)
- *... and 12 more nodes in this community*

## Relationships

- No strong cross-community connections detected

## Source Files

- `supabase/migrations/20260805000001_database_hardening.sql`

## Audit Trail

- EXTRACTED: 52 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*