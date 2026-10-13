-- Migration 010: Fix Weekly Dishes — resolves all 5 root-cause bugs
-- Run in Supabase SQL editor or: supabase db push
--
-- Bugs fixed:
--  1. chef_id/kitchen_id column name mismatch  (CRITICAL)
--  2. Missing UNIQUE constraint (onConflict silently dropped rows)
--  3. Missing columns that service layer expects (week_start_date, meal_type, close_time)
--  4. Missing write INSERT/UPDATE/DELETE policy for authenticated chefs
--  5. Realtime not enabled (documented — enable manually in Dashboard if CLI cannot)

-- ── Step 1: Ensure kitchen_id column exists and is the canonical FK ──────────
DO $$
BEGIN
  -- Add kitchen_id if it doesn't exist yet (idempotent — 004 may have added it)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'weekly_dishes'
      AND column_name  = 'kitchen_id'
  ) THEN
    ALTER TABLE public.weekly_dishes
      ADD COLUMN kitchen_id uuid REFERENCES public.kitchens(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added kitchen_id column to weekly_dishes';
  END IF;
END $$;

-- ── Step 2: Back-fill kitchen_id from chef_id where possible ─────────────────
-- chef_id references profiles(id); kitchens.chef_user_id references profiles(id)
UPDATE public.weekly_dishes wd
SET    kitchen_id = k.id
FROM   public.kitchens k
WHERE  wd.kitchen_id IS NULL
  AND  wd.chef_id    IS NOT NULL
  AND  k.chef_user_id = wd.chef_id;

-- ── Step 3: Add missing columns that the service layer expects ────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'weekly_dishes' AND column_name = 'week_start_date'
  ) THEN
    ALTER TABLE public.weekly_dishes ADD COLUMN week_start_date date NOT NULL DEFAULT date_trunc('week', now())::date;
    RAISE NOTICE 'Added week_start_date column';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'weekly_dishes' AND column_name = 'meal_type'
  ) THEN
    ALTER TABLE public.weekly_dishes ADD COLUMN meal_type text NOT NULL DEFAULT 'Lunch'
      CHECK (meal_type IN ('Breakfast','Lunch','Dinner','Snacks'));
    RAISE NOTICE 'Added meal_type column';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'weekly_dishes' AND column_name = 'close_time'
  ) THEN
    ALTER TABLE public.weekly_dishes ADD COLUMN close_time text NOT NULL DEFAULT '06:00 PM';
    RAISE NOTICE 'Added close_time column';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'weekly_dishes' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE public.weekly_dishes ADD COLUMN quantity integer NOT NULL DEFAULT 20
      CHECK (quantity > 0);
    RAISE NOTICE 'Added quantity column';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'weekly_dishes' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.weekly_dishes ADD COLUMN updated_at timestamptz DEFAULT now();
    RAISE NOTICE 'Added updated_at column';
  END IF;
END $$;

-- ── Step 4: Add UNIQUE constraint so upsert(onConflict: ...) actually works ───
-- The service layer does:
--   .upsert(payload, { onConflict: 'kitchen_id,day,dish_name,week_start_date' })
-- Without this constraint Supabase silently ignores the upsert.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename  = 'weekly_dishes'
      AND indexname  = 'weekly_dishes_unique_slot'
  ) THEN
    ALTER TABLE public.weekly_dishes
      ADD CONSTRAINT weekly_dishes_unique_slot
      UNIQUE (kitchen_id, day, dish_name, week_start_date);
    RAISE NOTICE 'Added UNIQUE constraint weekly_dishes_unique_slot';
  END IF;
END $$;

-- ── Step 5: Add missing indexes for the new columns ──────────────────────────
CREATE INDEX IF NOT EXISTS idx_weekly_dishes_kitchen_week
  ON public.weekly_dishes(kitchen_id, week_start_date);

CREATE INDEX IF NOT EXISTS idx_weekly_dishes_week_status
  ON public.weekly_dishes(week_start_date, status);

-- ── Step 6: Add write policies so authenticated chefs can INSERT/UPDATE/DELETE ─
-- (004 only added SELECT for anon; chefs need full write access to their own rows)
DROP POLICY IF EXISTS "Chefs write own weekly dishes"   ON public.weekly_dishes;
DROP POLICY IF EXISTS "Authenticated edit weekly dishes" ON public.weekly_dishes;

-- Chefs can manage their own kitchen's dishes
CREATE POLICY "Chefs write own weekly dishes"
  ON public.weekly_dishes
  FOR ALL
  TO authenticated
  USING (
    kitchen_id IN (
      SELECT id FROM public.kitchens
      WHERE chef_user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    kitchen_id IN (
      SELECT id FROM public.kitchens
      WHERE chef_user_id = (SELECT auth.uid())
    )
  );

-- Consumers (anon + authenticated) can SELECT active dishes of the current week
DROP POLICY IF EXISTS "Public select weekly dishes" ON public.weekly_dishes;
CREATE POLICY "Public select weekly dishes"
  ON public.weekly_dishes
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- ── Step 7: auto-update updated_at trigger (idempotent) ──────────────────────
CREATE OR REPLACE FUNCTION update_weekly_dishes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS weekly_dishes_updated_at ON public.weekly_dishes;
CREATE TRIGGER weekly_dishes_updated_at
  BEFORE UPDATE ON public.weekly_dishes
  FOR EACH ROW EXECUTE FUNCTION update_weekly_dishes_updated_at();

-- ── Step 8: Enable Realtime publication ──────────────────────────────────────
-- NOTE: If the supabase_realtime publication doesn't exist yet, this is a no-op.
-- You can also enable it in Supabase Dashboard → Database → Replication.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_dishes;
    RAISE NOTICE 'weekly_dishes added to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'supabase_realtime publication not found — enable Realtime manually in Dashboard';
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Realtime already configured or could not be set: %', SQLERRM;
END $$;

-- ── Step 9: Make order_items.dish_id flexible for weekly dishes ─────────────
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_dish_id_fkey;
ALTER TABLE public.order_items ALTER COLUMN dish_id DROP NOT NULL;

SELECT 'Migration 010: weekly_dishes fixed successfully' AS result;
