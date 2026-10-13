-- coupon.repository.ts/coupon.service.ts implement a live, routed coupon
-- feature (business.routes.ts) that has never actually worked against the
-- real database:
--   - coupons.starts_at/ends_at are NOT NULL with no default, but nothing in
--     this code ever sets them — every createCoupon call would fail outright.
--   - discount_type's real CHECK only allows 'PERCENTAGE'/'FIXED', but the
--     service layer's actual logic branches on 'FLAT'/'PERCENTAGE'/
--     'FREE_DELIVERY' — the CHECK constraint itself rejects two of the three
--     real code paths.
--   - usage_limit/current_usage, society_id/kitchen_id restriction, and a
--     coupon_usage table + increment_coupon_usage() RPC are all referenced
--     but none of them exist.
-- The design is clear and fully specified in types/coupon.ts and
-- coupon.service.ts's actual branching logic, so fixed properly (same
-- reasoning as the wallet ledger) rather than left broken or skipped.

ALTER TABLE public.coupons ALTER COLUMN starts_at SET DEFAULT now();
ALTER TABLE public.coupons ALTER COLUMN starts_at DROP NOT NULL;
ALTER TABLE public.coupons ALTER COLUMN ends_at DROP NOT NULL;

ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_discount_type_check;
ALTER TABLE public.coupons ADD CONSTRAINT coupons_discount_type_check
  CHECK (discount_type IN ('PERCENTAGE', 'FIXED', 'FLAT', 'FREE_DELIVERY'));

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS usage_limit integer,
  ADD COLUMN IF NOT EXISTS current_usage integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS society_id uuid REFERENCES public.societies(id),
  ADD COLUMN IF NOT EXISTS kitchen_id uuid REFERENCES public.kitchens(id);

CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id),
    order_id UUID REFERENCES public.orders(id),
    discount_applied NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
