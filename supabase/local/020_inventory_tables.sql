-- ingredients/kitchen_inventory/recipe_ingredients/inventory_transactions/
-- inventory_wastage never existed (confirmed absent from the live schema
-- dump), despite being live-routed (inventory.routes.ts). Created per the
-- fully-specified shapes in types/inventory.ts.

CREATE TABLE IF NOT EXISTS public.ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kitchen_id UUID NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    cost_per_unit NUMERIC NOT NULL DEFAULT 0,
    shelf_life_days INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kitchen_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    kitchen_id UUID NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
    quantity NUMERIC NOT NULL DEFAULT 0,
    reserved_quantity NUMERIC NOT NULL DEFAULT 0,
    min_stock_level NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    quantity_required NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES public.kitchen_inventory(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('ADD', 'DEDUCT', 'ADJUST', 'WASTE', 'PURCHASE')),
    amount NUMERIC NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_wastage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES public.kitchen_inventory(id) ON DELETE CASCADE,
    quantity_lost NUMERIC NOT NULL,
    reason TEXT NOT NULL,
    financial_loss NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
