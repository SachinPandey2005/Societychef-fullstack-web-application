-- Migration 003: decrement_dish_quantity RPC
-- Run in Supabase SQL editor after migration 002.
-- This function is called atomically from placeOrder to prevent race conditions.

CREATE OR REPLACE FUNCTION decrement_dish_quantity(dish_id text, qty integer)
RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'weekly_dishes') THEN
    UPDATE weekly_dishes
    SET
      remaining_quantity = GREATEST(remaining_quantity - qty, 0),
      status = CASE
                 WHEN remaining_quantity - qty <= 0 THEN 'sold_out'
                 ELSE status
               END
    WHERE id::text = dish_id OR id::text LIKE (dish_id || '%');
  END IF;
END;
$$ LANGUAGE plpgsql;
