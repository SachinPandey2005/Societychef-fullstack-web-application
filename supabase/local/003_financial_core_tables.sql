-- The real wallets/wallet_transactions tables (already in 001) have a
-- different shape than supabase/migrations/006_financial_core.sql assumes
-- (that migration's DROP TABLE + CREATE TABLE was apparently never applied
-- live — the real wallets table has both profile_id AND user_id, which 006's
-- version doesn't). Do NOT drop/recreate wallets or wallet_transactions here.
--
-- financial_ledger and financial_audit_logs, however, are genuinely new —
-- confirmed absent from the live schema dump — and are real, well-specified
-- infrastructure for atomic double-entry wallet transactions (see
-- apps/backend/src/repositories/wallet.repository.ts and
-- src/types/wallet.ts's LedgerEntry, which already expected this to exist).
-- Only the two tables are ported here; the stored-procedure logic itself
-- (execute_financial_transaction) is reimplemented directly in TypeScript
-- using a Drizzle transaction instead, to keep business logic in the same
-- language as the rest of this migration rather than a Postgres-specific RPC.

CREATE TABLE IF NOT EXISTS public.financial_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debit_wallet_id UUID REFERENCES public.wallets(id),
    credit_wallet_id UUID REFERENCES public.wallets(id),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    transaction_reference TEXT,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.financial_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES public.wallets(id),
    action TEXT NOT NULL,
    old_balance NUMERIC NOT NULL,
    new_balance NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
