-- Phase 9: Performance Tracking, Achievements, Incentives, Leaderboards & Reward Center Schema

-- 1. Extend delivery_partners with XP & Level info if not already there
ALTER TABLE public.delivery_partners
ADD COLUMN IF NOT EXISTS experience_points integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS partner_level integer DEFAULT 1;

-- 2. Partner Analytics & Core Metrics
CREATE TABLE IF NOT EXISTS public.delivery_partner_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  overall_rating numeric(3,2) DEFAULT 5.00,
  acceptance_rate numeric(5,2) DEFAULT 100.00,
  completion_rate numeric(5,2) DEFAULT 100.00,
  on_time_delivery_rate numeric(5,2) DEFAULT 100.00,
  avg_delivery_time_minutes integer DEFAULT 0,
  today_score integer DEFAULT 100,
  weekly_score integer DEFAULT 100,
  monthly_score integer DEFAULT 100,
  lifetime_deliveries integer DEFAULT 0,
  days_worked integer DEFAULT 0,
  hours_online numeric(6,2) DEFAULT 0.00,
  shift_completion_rate numeric(5,2) DEFAULT 100.00,
  late_starts_count integer DEFAULT 0,
  break_compliance_rate numeric(5,2) DEFAULT 100.00,
  package_handling_score numeric(5,2) DEFAULT 100.00,
  customer_satisfaction_score numeric(5,2) DEFAULT 100.00,
  order_accuracy_score numeric(5,2) DEFAULT 100.00,
  professionalism_score numeric(5,2) DEFAULT 100.00,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_partner_metrics UNIQUE (partner_id)
);

-- 3. Achievements & Badges
CREATE TABLE IF NOT EXISTS public.partner_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  badge_code text NOT NULL, -- '100_DELIVERIES', '500_DELIVERIES', '1000_DELIVERIES', 'FIVE_STAR', 'FAST_DELIVERY', 'WEEKEND_CHAMPION', 'FESTIVAL_HERO', 'ELITE_PARTNER'
  title text NOT NULL,
  description text,
  unlocked_at timestamptz DEFAULT now(),
  CONSTRAINT unique_partner_badge UNIQUE (partner_id, badge_code)
);

-- 4. Target Tracking
CREATE TABLE IF NOT EXISTS public.partner_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('DAILY', 'WEEKLY', 'MONTHLY')),
  target_deliveries integer NOT NULL,
  completed_deliveries integer DEFAULT 0,
  projected_earnings numeric NOT NULL DEFAULT 0.00,
  starts_at date NOT NULL,
  ends_at date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 5. Incentives
CREATE TABLE IF NOT EXISTS public.partner_incentives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  incentive_type text NOT NULL, -- 'PEAK_HOUR', 'WEEKEND', 'FESTIVAL', 'TARGET', 'REFERRAL', 'RAIN', 'SPECIAL_CAMPAIGN'
  title text NOT NULL,
  amount numeric NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'ELIGIBLE' CHECK (status IN ('ELIGIBLE', 'INELIGIBLE', 'CLAIMED')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 6. Leaderboards Table
CREATE TABLE IF NOT EXISTS public.partner_leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  scope text NOT NULL CHECK (scope IN ('SOCIETY', 'CITY', 'REGION', 'COMPANY')),
  rank integer NOT NULL,
  score integer NOT NULL,
  completed_deliveries integer DEFAULT 0,
  rating numeric(3,2) DEFAULT 5.00,
  as_of_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 7. Reward Catalog
CREATE TABLE IF NOT EXISTS public.reward_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  points_cost integer NOT NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('COUPON', 'GIFT_VOUCHER', 'RECOGNITION_CERTIFICATE')),
  is_active boolean DEFAULT true,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- 8. Reward Points & Redemptions
CREATE TABLE IF NOT EXISTS public.partner_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  reward_points_balance integer DEFAULT 0,
  total_points_earned integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_partner_rewards UNIQUE (partner_id)
);

CREATE TABLE IF NOT EXISTS public.partner_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  reward_catalog_id uuid REFERENCES public.reward_catalog(id) ON DELETE SET NULL,
  code text NOT NULL,
  status text DEFAULT 'ISSUED' CHECK (status IN ('ISSUED', 'REDEEMED', 'EXPIRED')),
  redeemed_at timestamptz DEFAULT now()
);

-- 9. Penalty Summary
CREATE TABLE IF NOT EXISTS public.partner_penalties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  penalty_type text NOT NULL, -- 'LATE_DELIVERY', 'CANCELLED_DELIVERY', 'POLICY_VIOLATION'
  amount numeric DEFAULT 0.00,
  reason text NOT NULL,
  warning_issued boolean DEFAULT false,
  status text DEFAULT 'APPLIED' CHECK (status IN ('APPLIED', 'APPEALED', 'WAIVED')),
  appeal_reason text,
  created_at timestamptz DEFAULT now()
);

-- 10. Learning Center Modules
CREATE TABLE IF NOT EXISTS public.learning_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 5,
  category text DEFAULT 'BEST_PRACTICES', -- 'BEST_PRACTICES', 'SAFETY', 'POLICIES', 'NEW_FEATURES'
  created_at timestamptz DEFAULT now()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_partner_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_badges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_targets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_leaderboard;
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_incentives;
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_rewards;

-- 11. Initial Seed Data
-- Update Delivery Partners level and XP
UPDATE public.delivery_partners SET experience_points = 1850, partner_level = 3 WHERE id = '45000000-0000-0000-0000-000000000001';
UPDATE public.delivery_partners SET experience_points = 820, partner_level = 2 WHERE id = '45000000-0000-0000-0000-000000000002';

-- Add Core Metrics
INSERT INTO public.delivery_partner_metrics 
(partner_id, overall_rating, acceptance_rate, completion_rate, on_time_delivery_rate, avg_delivery_time_minutes, today_score, weekly_score, monthly_score, lifetime_deliveries, days_worked, hours_online, shift_completion_rate, late_starts_count, break_compliance_rate, package_handling_score, customer_satisfaction_score, order_accuracy_score, professionalism_score)
VALUES
('45000000-0000-0000-0000-000000000001', 4.92, 98.40, 99.10, 97.80, 18, 98, 96, 95, 1420, 45, 180.50, 98.20, 1, 95.00, 99.00, 98.50, 100.00, 98.00),
('45000000-0000-0000-0000-000000000002', 4.75, 94.00, 95.50, 92.00, 24, 88, 89, 91, 380, 20, 82.00, 94.00, 2, 90.00, 94.50, 95.00, 96.00, 95.00)
ON CONFLICT (partner_id) DO NOTHING;

-- Add Badges
INSERT INTO public.partner_badges (partner_id, badge_code, title, description) VALUES
('45000000-0000-0000-0000-000000000001', '100_DELIVERIES', 'Century Partner', 'Completed 100 successful deliveries'),
('45000000-0000-0000-0000-000000000001', '500_DELIVERIES', 'Half-K Hero', 'Completed 500 successful deliveries'),
('45000000-0000-0000-0000-000000000001', '1000_DELIVERIES', 'Grandmaster Partner', 'Completed 1000 successful deliveries'),
('45000000-0000-0000-0000-000000000001', 'FIVE_STAR', '5-Star Captain', 'Maintained a perfect 5.0 rating over 20 consecutive deliveries'),
('45000000-0000-0000-0000-000000000001', 'FAST_DELIVERY', 'Speedster', 'Average delivery time under 15 minutes for 10 orders'),
('45000000-0000-0000-0000-000000000002', '100_DELIVERIES', 'Century Partner', 'Completed 100 successful deliveries'),
('45000000-0000-0000-0000-000000000002', 'WEEKEND_CHAMPION', 'Weekend Warrior', 'Worked 4 consecutive weekends without missing a shift')
ON CONFLICT (partner_id, badge_code) DO NOTHING;

-- Add Targets
INSERT INTO public.partner_targets (partner_id, target_type, target_deliveries, completed_deliveries, projected_earnings, starts_at, ends_at) VALUES
('45000000-0000-0000-0000-000000000001', 'DAILY', 12, 8, 950.00, CURRENT_DATE, CURRENT_DATE),
('45000000-0000-0000-0000-000000000001', 'WEEKLY', 80, 52, 6400.00, date_trunc('week', CURRENT_DATE)::date, (date_trunc('week', CURRENT_DATE) + interval '6 days')::date),
('45000000-0000-0000-0000-000000000001', 'MONTHLY', 320, 240, 26000.00, date_trunc('month', CURRENT_DATE)::date, (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date)
ON CONFLICT DO NOTHING;

-- Add Incentives
INSERT INTO public.partner_incentives (partner_id, incentive_type, title, amount, status) VALUES
('45000000-0000-0000-0000-000000000001', 'PEAK_HOUR', 'Sunday Peak Surge', 120.00, 'ELIGIBLE'),
('45000000-0000-0000-0000-000000000001', 'RAIN', 'Monsoon Surge Bonus', 250.00, 'ELIGIBLE'),
('45000000-0000-0000-0000-000000000001', 'WEEKEND', 'Weekend Target Streak', 500.00, 'CLAIMED'),
('45000000-0000-0000-0000-000000000001', 'REFERRAL', 'Partner Referral (Ramesh)', 1000.00, 'CLAIMED')
ON CONFLICT DO NOTHING;

-- Add Leaderboard data
INSERT INTO public.partner_leaderboard (partner_id, scope, rank, score, completed_deliveries, rating, as_of_date) VALUES
('45000000-0000-0000-0000-000000000001', 'SOCIETY', 1, 980, 24, 4.95, CURRENT_DATE),
('45000000-0000-0000-0000-000000000001', 'CITY', 12, 940, 110, 4.92, CURRENT_DATE),
('45000000-0000-0000-0000-000000000001', 'REGION', 45, 930, 340, 4.91, CURRENT_DATE),
('45000000-0000-0000-0000-000000000001', 'COMPANY', 88, 925, 1420, 4.92, CURRENT_DATE),
('45000000-0000-0000-0000-000000000002', 'SOCIETY', 2, 890, 18, 4.80, CURRENT_DATE),
('45000000-0000-0000-0000-000000000002', 'CITY', 54, 850, 80, 4.75, CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- Add Reward Catalog
INSERT INTO public.reward_catalog (title, description, points_cost, reward_type, is_active) VALUES
('₹250 Amazon Voucher', 'Redeemable on Amazon India store website', 2500, 'GIFT_VOUCHER', true),
('₹500 Fuel Coupon', 'Redeemable at authorized BPCL/HPCL outlets', 4500, 'COUPON', true),
('Perfect Safety Certificate', 'Recognizing zero safety violations in a quarter', 1000, 'RECOGNITION_CERTIFICATE', true),
('Elite Partner Certificate', 'Awarded to Level 3 captains with 4.9+ rating', 1500, 'RECOGNITION_CERTIFICATE', true)
ON CONFLICT DO NOTHING;

-- Add Partner Rewards Points
INSERT INTO public.partner_rewards (partner_id, reward_points_balance, total_points_earned) VALUES
('45000000-0000-0000-0000-000000000001', 3450, 8500),
('45000000-0000-0000-0000-000000000002', 800, 2400)
ON CONFLICT (partner_id) DO NOTHING;

-- Add Learning Modules
INSERT INTO public.learning_videos (title, description, video_url, duration_minutes, category) VALUES
('Standard Package Handling', 'Learn standard safety procedures for handling customer food packs', 'https://youtube.com/embed/pkg-handle', 4, 'BEST_PRACTICES'),
('Monsoon Safety Guidelines', 'Safe driving and rain protection best practices during monsoon deliveries', 'https://youtube.com/embed/rain-safety', 6, 'SAFETY'),
('Understanding Late Deliveries Policy', 'Review penalty policy details and how to file a valid dispute appeal', 'https://youtube.com/embed/late-policy', 5, 'POLICIES'),
('New Surge Earnings System', 'Introducing the live peak hour rain surge calculation engine UI', 'https://youtube.com/embed/surge-intro', 3, 'NEW_FEATURES')
ON CONFLICT DO NOTHING;
