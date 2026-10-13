-- marketing_preferences/marketing_campaigns/customer_engagement never
-- existed (confirmed absent from the live schema dump), despite being
-- live-routed (marketing.routes.ts). Distinct from campaign.repository.ts's
-- `campaigns` table (types/campaign.ts) — two separately-specified,
-- non-overlapping campaign concepts in this codebase, both now real.
-- Created per the fully-specified shapes in types/marketing.ts.

CREATE TABLE IF NOT EXISTS public.marketing_preferences (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_opt_in BOOLEAN NOT NULL DEFAULT true,
    sms_opt_in BOOLEAN NOT NULL DEFAULT true,
    push_opt_in BOOLEAN NOT NULL DEFAULT true,
    promotions_opt_in BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    target_segment TEXT,
    channel TEXT NOT NULL CHECK (channel IN ('PUSH', 'IN_APP', 'EMAIL', 'SMS')),
    content_template TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED', 'COMPLETED')),
    scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_engagement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('SENT', 'DELIVERED', 'OPENED', 'CONVERTED')),
    converted_order_id UUID REFERENCES public.orders(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
