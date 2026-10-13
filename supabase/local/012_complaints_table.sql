-- complaints never existed (confirmed absent from the live schema dump)
-- despite being live-routed under /crm/complaints. getComplaints had a
-- fallback to a second table, support_tickets, which also doesn't exist —
-- dead code once this table actually works. Created per the fully-specified
-- shape in types/complaint.ts.

CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id),
    target_id TEXT,
    type TEXT NOT NULL CHECK (type IN ('FOOD_QUALITY', 'LATE_DELIVERY', 'MISSING_ITEM', 'PAYMENT_ISSUE', 'REFUND_ISSUE', 'KITCHEN_HYGIENE', 'CHEF_BEHAVIOUR', 'CUSTOMER_BEHAVIOUR', 'TECHNICAL_ISSUE')),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED')),
    assigned_to UUID REFERENCES public.profiles(id),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
