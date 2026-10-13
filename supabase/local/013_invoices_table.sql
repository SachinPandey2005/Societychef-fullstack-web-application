-- invoices never existed (confirmed absent from the live schema dump),
-- despite being wired to fire on every completed order
-- (invoice.service.ts#generateOrderInvoice) and live-routed under
-- finance.routes.ts. Caught in a try/catch at the event-listener level, so
-- this failed silently rather than breaking order completion. Created per
-- the fully-specified shape in types/invoice.ts. payout_requests already
-- exists (created earlier this session) and needed no changes.

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    reference_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('CONSUMER_ORDER', 'CHEF_SETTLEMENT', 'CREDIT_NOTE', 'DEBIT_NOTE')),
    issued_to UUID NOT NULL REFERENCES public.profiles(id),
    subtotal NUMERIC NOT NULL,
    tax_total NUMERIC NOT NULL DEFAULT 0,
    discount_total NUMERIC NOT NULL DEFAULT 0,
    grand_total NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('DRAFT', 'ISSUED', 'PAID', 'CANCELLED')),
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    download_url TEXT
);
