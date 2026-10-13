-- Weekly-dish quantity was never restored on order cancellation —
-- order_items.dish_id can't reference a weekly dish (it's a real FK to
-- dishes), so there was no way to recover which weekly_dishes row a
-- cancelled item should give its quantity back to. No FK constraint here
-- deliberately: a weekly dish row can be deleted later without needing to
-- touch historical order_items, same spirit as dish_id already being a
-- loose nullable reference for this exact table.
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS weekly_dish_id uuid;
