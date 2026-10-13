-- supply_orders/supply_order_items never existed — app/(chef)/supplies.tsx's
-- checkout waited 500ms and showed a success alert with nothing persisted
-- anywhere, every single time. supply_items (the catalog) already existed.
-- New tables so a chef's packing-supplies order is actually recorded,
-- mirroring the shape of orders/order_items but scoped to this much simpler
-- kitchen-to-platform purchase (no consumer, no delivery).

CREATE TABLE IF NOT EXISTS public.supply_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kitchen_id UUID NOT NULL REFERENCES public.kitchens(id),
    status TEXT NOT NULL DEFAULT 'PLACED',
    total_amount NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.supply_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supply_order_id UUID NOT NULL REFERENCES public.supply_orders(id) ON DELETE CASCADE,
    supply_item_id UUID REFERENCES public.supply_items(id),
    item_name_snapshot TEXT NOT NULL,
    price_snapshot NUMERIC NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
