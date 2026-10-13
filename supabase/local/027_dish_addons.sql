-- Chef-authored per-dish add-ons/customizations (e.g. "Extra Mint Chutney").
-- Previously the mobile app showed a hardcoded, category-keyed list of fake
-- add-ons on every dish (components/DishDetailModal.tsx) that a chef never
-- set and never saw a consumer's selection of — this table makes it real.
CREATE TABLE IF NOT EXISTS dish_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id uuid NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dish_addons_dish_id_idx ON dish_addons(dish_id);

-- Snapshot of the add-ons actually selected at order time (same spirit as
-- dish_name_snapshot/price_snapshot on this same table) — a chef editing or
-- deleting an add-on later must never change what a past order says it sold.
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS addons jsonb NOT NULL DEFAULT '[]'::jsonb;
