-- commission_rules never existed (confirmed absent from the live schema
-- dump) despite being live-routed (commission.routes.ts). rule_name/rule_type
-- are synthesized in application code, not real columns — intentional,
-- matching the repository's own fallback logic. Created per
-- types/commission.ts's other fields.

CREATE TABLE IF NOT EXISTS public.commission_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kitchen_id UUID REFERENCES public.kitchens(id),
    society_id UUID REFERENCES public.societies(id),
    category TEXT,
    percentage NUMERIC NOT NULL,
    fixed_fee NUMERIC NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    effective_date TIMESTAMPTZ,
    expiry_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
