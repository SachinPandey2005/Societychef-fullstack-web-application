-- reward.repository.ts targets reward_points/point_transactions/referrals —
-- a consumer-facing loyalty system distinct from the delivery-partner
-- reward_catalog/partner_rewards/partner_redemptions tables that already
-- exist. None of these three existed, confirmed absent from the live schema
-- dump, despite GET /business/loyalty/rewards being live-routed and
-- RewardService.addPoints being wired to fire on every completed order.
-- getBalance's "not found" fallback only catches PostgREST's no-rows code,
-- not a missing-table error, so this endpoint has always thrown instead of
-- returning a default balance. Created per the fully-specified shapes in
-- types/reward.ts.

CREATE TABLE IF NOT EXISTS public.reward_points (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    points_balance INTEGER NOT NULL DEFAULT 0,
    level TEXT NOT NULL DEFAULT 'Bronze' CHECK (level IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
    total_earned INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('EARN', 'REDEEM', 'EXPIRE')),
    source_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id),
    referred_id UUID NOT NULL REFERENCES public.profiles(id),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED')),
    reward_amount INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
