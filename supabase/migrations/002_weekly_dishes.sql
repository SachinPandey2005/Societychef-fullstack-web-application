-- Migration 002: weekly_dishes table
-- Run in Supabase SQL editor or via: supabase db push
-- After running: enable Realtime for weekly_dishes in Table Editor → Replication

CREATE TABLE IF NOT EXISTS weekly_dishes (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id         uuid REFERENCES public.kitchens(id) ON DELETE CASCADE,
  chef_id            uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  day                text NOT NULL CHECK (day IN ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  dish_name          text NOT NULL CHECK (char_length(dish_name) <= 80),
  category           text NOT NULL CHECK (category IN ('Veg','Non-Veg')),
  meal_type          text NOT NULL DEFAULT 'Lunch' CHECK (meal_type IN ('Breakfast','Lunch','Dinner','Snacks')),
  price              numeric(8,2) NOT NULL CHECK (price > 0),
  quantity           integer NOT NULL DEFAULT 20 CHECK (quantity > 0),
  remaining_quantity integer NOT NULL DEFAULT 20 CHECK (remaining_quantity >= 0),
  description        text CHECK (char_length(description) <= 300),
  close_time         text NOT NULL DEFAULT '06:00 PM',
  status             text NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','paused','sold_out','hidden')),
  week_start_date    date NOT NULL DEFAULT date_trunc('week', now())::date,  -- Monday of the active week
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now(),
  CONSTRAINT weekly_dishes_unique_slot UNIQUE (kitchen_id, day, dish_name, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_weekly_dishes_kitchen_id ON weekly_dishes(kitchen_id);
CREATE INDEX IF NOT EXISTS idx_weekly_dishes_chef_id    ON weekly_dishes(chef_id);
CREATE INDEX IF NOT EXISTS idx_weekly_dishes_day        ON weekly_dishes(day);
CREATE INDEX IF NOT EXISTS idx_weekly_dishes_status     ON weekly_dishes(status);
CREATE INDEX IF NOT EXISTS idx_weekly_dishes_week       ON weekly_dishes(kitchen_id, week_start_date);

-- Auto-update updated_at on any row update
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS weekly_dishes_updated_at ON weekly_dishes;
CREATE TRIGGER weekly_dishes_updated_at
  BEFORE UPDATE ON weekly_dishes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
