-- campaign.repository.ts targets `campaigns`, live-routed under /campaigns,
-- confirmed absent from the live schema dump. Created per the
-- fully-specified shape in types/campaign.ts.

CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('PUSH', 'BANNER', 'COUPON', 'REFERRAL')),
    target_audience TEXT NOT NULL CHECK (target_audience IN ('ALL', 'SOCIETY', 'INACTIVE', 'VIP', 'CHEFS', 'NEW_USERS')),
    target_id UUID,
    content TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metrics_sent INTEGER NOT NULL DEFAULT 0,
    metrics_opened INTEGER NOT NULL DEFAULT 0,
    metrics_converted INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
