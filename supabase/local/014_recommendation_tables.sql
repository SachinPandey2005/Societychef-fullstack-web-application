-- recommendation_preferences/recommendation_feedback never existed
-- (confirmed absent from the live schema dump) despite being live-routed
-- (recommendation.routes.ts). Created per the fully-specified shapes in
-- types/recommendation.ts.

CREATE TABLE IF NOT EXISTS public.recommendation_preferences (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    favorite_cuisines TEXT[] NOT NULL DEFAULT '{}',
    dietary_preferences TEXT[] NOT NULL DEFAULT '{}',
    price_preference TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (price_preference IN ('LOW', 'MEDIUM', 'HIGH')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recommendation_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('DISH', 'KITCHEN', 'CHEF', 'COUPON')),
    action TEXT NOT NULL CHECK (action IN ('LIKE', 'DISLIKE', 'NOT_INTERESTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
