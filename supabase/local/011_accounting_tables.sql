-- accounting_journals/accounting_ledger_lines/tax_records never existed,
-- confirmed absent from the live schema dump. Caught in a try/catch at the
-- ORDER_COMPLETED event listener (accounting.service.ts), so this failed
-- silently rather than breaking order completion — lower severity than the
-- AI chat/reward findings, but still a live, routed feature
-- (GET /finance/accounting/journals, admin-only). account_id in
-- accounting_ledger_lines is a plain field with no FK, matching the original
-- design — nothing in this codebase creates or validates a ledger-accounts
-- table; postRevenueJournal uses hardcoded placeholder account ids.

CREATE TABLE IF NOT EXISTS public.accounting_journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date TIMESTAMPTZ NOT NULL,
    description TEXT NOT NULL,
    reference_type TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    total_amount NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.accounting_ledger_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_id UUID NOT NULL REFERENCES public.accounting_journals(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL,
    is_credit BOOLEAN NOT NULL,
    amount NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tax_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id),
    tax_type TEXT NOT NULL,
    tax_rate NUMERIC NOT NULL,
    tax_amount NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
