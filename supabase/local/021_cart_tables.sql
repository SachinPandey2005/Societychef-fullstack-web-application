-- carts/cart_items never existed (confirmed absent from the live schema
-- dump). This is the backend's own server-side cart, feeding directly into
-- OrderService.createOrderFromCart (POST /orders/checkout) — which was
-- already confirmed broken for unrelated column-name reasons (see the
-- order.repository.ts conversion) and would have failed even earlier here,
-- at CartService.getCart, before ever reaching order creation. Created per
-- the fully-specified shapes in types/cart.ts.

CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    kitchen_id UUID REFERENCES public.kitchens(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    dish_id UUID NOT NULL REFERENCES public.dishes(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
