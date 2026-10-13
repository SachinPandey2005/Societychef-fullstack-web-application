-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "dishes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kitchen_id" uuid,
	"name" text NOT NULL,
	"category" text DEFAULT 'Homestyle',
	"price" numeric NOT NULL,
	"diet_type" text DEFAULT 'VEG',
	"prep_time_minutes" integer DEFAULT 120,
	"tags" text[] DEFAULT '{"RAY"}',
	"is_available" boolean DEFAULT true,
	"is_free" boolean DEFAULT false,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid,
	"sender_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"media_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'SENT' NOT NULL,
	CONSTRAINT "chat_messages_status_check" CHECK (status = ANY (ARRAY['SENT'::text, 'DELIVERED'::text, 'READ'::text]))
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"dish_id" uuid,
	"dish_name_snapshot" text,
	"price_snapshot" numeric,
	"quantity" integer DEFAULT 1,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "weekly_dishes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kitchen_id" uuid,
	"day" text NOT NULL,
	"dish_name" text NOT NULL,
	"category" text DEFAULT 'Veg',
	"meal_type" text DEFAULT 'Lunch',
	"price" numeric NOT NULL,
	"quantity" integer DEFAULT 10,
	"remaining_quantity" integer DEFAULT 10,
	"description" text,
	"close_time" text DEFAULT '6:00 PM',
	"status" text DEFAULT 'open',
	"week_start_date" date,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consumer_id" uuid,
	"kitchen_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "supply_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"unit" text DEFAULT 'kg',
	"price" numeric DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"order_id" text NOT NULL,
	"kitchen_id" text NOT NULL,
	"kitchen_name" text,
	"dish_id" text,
	"dish_name" text,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"consumer_id" uuid,
	"customer_id" uuid,
	CONSTRAINT "reviews_rating_check" CHECK ((rating >= 1) AND (rating <= 5))
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"phone" text,
	"name" text,
	"display_name" text,
	"society" text,
	"role" text DEFAULT 'consumer',
	"roles" text[] DEFAULT '{"RAY['consumer'::tex"}',
	"active_role" text DEFAULT 'consumer',
	"chef_profile_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"flat" text,
	"status" text DEFAULT 'active',
	"email" text,
	"latitude" numeric,
	"longitude" numeric
);
--> statement-breakpoint
CREATE TABLE "settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kitchen_id" uuid NOT NULL,
	"total_sales" numeric DEFAULT '0' NOT NULL,
	"platform_commission" numeric DEFAULT '0' NOT NULL,
	"gateway_fees" numeric DEFAULT '0' NOT NULL,
	"taxes" numeric DEFAULT '0' NOT NULL,
	"refund_adjustments" numeric DEFAULT '0' NOT NULL,
	"net_payable" numeric DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"settlement_mode" text DEFAULT 'weekly' NOT NULL,
	"period_start" date,
	"period_end" date,
	"expected_at" timestamp with time zone,
	"held_transaction_id" uuid,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consumer_id" uuid NOT NULL,
	"label" text NOT NULL,
	"full_address" text NOT NULL,
	"latitude" numeric,
	"longitude" numeric,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "societies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"lat" numeric,
	"lng" numeric,
	"address" text,
	"state" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"vehicle_type" text NOT NULL,
	"status" text DEFAULT 'OFFLINE' NOT NULL,
	"current_latitude" numeric,
	"current_longitude" numeric,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"gender" text,
	"date_of_birth" date,
	"blood_group" text,
	"preferred_language" text DEFAULT 'English',
	"profile_photo_url" text,
	"permanent_address" text,
	"current_address" text,
	"city" text,
	"state" text,
	"pincode" text,
	"landmark" text,
	"kyc_status" text DEFAULT 'PENDING',
	"rejection_reason" text,
	"experience_points" integer DEFAULT 0,
	"partner_level" integer DEFAULT 1,
	CONSTRAINT "delivery_partners_kyc_status_check" CHECK (kyc_status = ANY (ARRAY['PENDING'::text, 'UNDER_REVIEW'::text, 'APPROVED'::text, 'REJECTED'::text, 'EXPIRED'::text]))
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid,
	"user_id" uuid,
	"role" text,
	"wallet_type" text,
	"balance" numeric DEFAULT '0.00' NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallets_role_check" CHECK (role = ANY (ARRAY['consumer'::text, 'chef'::text])),
	CONSTRAINT "wallets_wallet_type_check" CHECK (wallet_type = ANY (ARRAY['CONSUMER'::text, 'CHEF'::text, 'PLATFORM'::text]))
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid,
	"wallet_id" uuid NOT NULL,
	"amount" numeric NOT NULL,
	"type" text NOT NULL,
	"source" text,
	"reference_id" text,
	"order_id" uuid,
	"payment_id" uuid,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"discount_type" text NOT NULL,
	"discount_value" numeric NOT NULL,
	"min_order_value" numeric DEFAULT '0' NOT NULL,
	"max_discount" numeric,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "coupons_code_key" UNIQUE("code"),
	CONSTRAINT "coupons_discount_type_check" CHECK (discount_type = ANY (ARRAY['PERCENTAGE'::text, 'FIXED'::text]))
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"category" text,
	"priority" text DEFAULT 'MEDIUM',
	"order_id" uuid,
	"assigned_agent_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tickets_category_check" CHECK (category = ANY (ARRAY['DELIVERY_ISSUE'::text, 'PICKUP_ISSUE'::text, 'CUSTOMER_ISSUE'::text, 'CHEF_ISSUE'::text, 'PAYMENT_ISSUE'::text, 'WALLET_ISSUE'::text, 'TECHNICAL_ISSUE'::text, 'ACCOUNT_ISSUE'::text, 'SAFETY_ISSUE'::text, 'EMERGENCY'::text, 'OTHER'::text])),
	CONSTRAINT "tickets_priority_check" CHECK (priority = ANY (ARRAY['LOW'::text, 'MEDIUM'::text, 'HIGH'::text, 'URGENT'::text]))
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"refund_code" text NOT NULL,
	"order_id" uuid,
	"customer_id" uuid,
	"kitchen_id" uuid,
	"payment_id" text,
	"amount" numeric NOT NULL,
	"type" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"requested_by" uuid,
	"approved_by" uuid,
	"processed_by" uuid,
	"refund_reference" text,
	"gateway_refund_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refunds_refund_code_key" UNIQUE("refund_code"),
	CONSTRAINT "refunds_amount_check" CHECK (amount > (0)::numeric),
	CONSTRAINT "refunds_type_check" CHECK (type = ANY (ARRAY['FULL'::text, 'PARTIAL'::text, 'MANUAL'::text, 'AUTOMATIC'::text])),
	CONSTRAINT "refunds_status_check" CHECK (status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'PROCESSING'::text, 'COMPLETED'::text, 'FAILED'::text, 'REJECTED'::text]))
);
--> statement-breakpoint
CREATE TABLE "financial_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"adjustment_code" text NOT NULL,
	"adjustment_type" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid,
	"amount" numeric NOT NULL,
	"entry_type" text NOT NULL,
	"reason" text NOT NULL,
	"requested_by" uuid,
	"approved_by" uuid,
	"reference_entity_type" text,
	"reference_entity_id" text,
	"supporting_notes" text,
	"status" text DEFAULT 'APPROVED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "financial_adjustments_adjustment_code_key" UNIQUE("adjustment_code"),
	CONSTRAINT "financial_adjustments_adjustment_type_check" CHECK (adjustment_type = ANY (ARRAY['COMMISSION_CORRECTION'::text, 'SETTLEMENT_CORRECTION'::text, 'WALLET_CORRECTION'::text, 'TAX_ADJUSTMENT'::text, 'DELIVERY_CHARGE_ADJUSTMENT'::text, 'MANUAL_ACCOUNTING_ENTRY'::text, 'REFUND_ADJUSTMENT'::text, 'SETTLEMENT_REVERSAL'::text, 'PENALTY'::text, 'CHARGEBACK'::text, 'BONUS'::text, 'INCENTIVE'::text])),
	CONSTRAINT "financial_adjustments_target_type_check" CHECK (target_type = ANY (ARRAY['CHEF'::text, 'CUSTOMER'::text, 'PLATFORM'::text])),
	CONSTRAINT "financial_adjustments_entry_type_check" CHECK (entry_type = ANY (ARRAY['CREDIT'::text, 'DEBIT'::text])),
	CONSTRAINT "financial_adjustments_status_check" CHECK (status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text]))
);
--> statement-breakpoint
CREATE TABLE "dispute_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispute_code" text NOT NULL,
	"order_id" uuid,
	"customer_id" uuid,
	"kitchen_id" uuid,
	"category" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"priority" text DEFAULT 'MEDIUM' NOT NULL,
	"assigned_agent_id" uuid,
	"description" text NOT NULL,
	"resolution_notes" text,
	"resolution_time_minutes" integer,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dispute_cases_dispute_code_key" UNIQUE("dispute_code"),
	CONSTRAINT "dispute_cases_category_check" CHECK (category = ANY (ARRAY['INCORRECT_CHARGE'::text, 'MISSING_REFUND'::text, 'DUPLICATE_PAYMENT'::text, 'WRONG_SETTLEMENT'::text, 'WRONG_COMMISSION'::text, 'FAILED_PAYOUT'::text, 'FRAUD_REVIEW'::text])),
	CONSTRAINT "dispute_cases_status_check" CHECK (status = ANY (ARRAY['PENDING'::text, 'INVESTIGATING'::text, 'RESOLVED'::text, 'REJECTED'::text])),
	CONSTRAINT "dispute_cases_priority_check" CHECK (priority = ANY (ARRAY['LOW'::text, 'MEDIUM'::text, 'HIGH'::text, 'URGENT'::text]))
);
--> statement-breakpoint
CREATE TABLE "dispute_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispute_id" uuid NOT NULL,
	"author_id" uuid,
	"author_role" text,
	"comment" text NOT NULL,
	"is_internal" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid
);
--> statement-breakpoint
CREATE TABLE "partner_bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"holder_name" text NOT NULL,
	"bank_name" text NOT NULL,
	"account_number" text NOT NULL,
	"ifsc_code" text,
	"upi_id" text,
	"cheque_url" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partner_bank_accounts_partner_id_key" UNIQUE("partner_id"),
	CONSTRAINT "partner_bank_accounts_ifsc_code_check" CHECK ((ifsc_code IS NULL) OR (ifsc_code = ''::text) OR (ifsc_code ~* '^[A-Z]{4}0[A-Z0-9]{6}$'::text)),
	CONSTRAINT "partner_bank_accounts_status_check" CHECK (status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text]))
);
--> statement-breakpoint
CREATE TABLE "partner_emergency_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"primary_name" text NOT NULL,
	"primary_phone" text NOT NULL,
	"primary_relationship" text NOT NULL,
	"secondary_name" text,
	"secondary_phone" text,
	"secondary_relationship" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partner_emergency_contacts_partner_id_key" UNIQUE("partner_id")
);
--> statement-breakpoint
CREATE TABLE "partner_society_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"society_id" uuid NOT NULL,
	"tower_coverage" text[] DEFAULT '{""}',
	"delivery_radius_km" numeric DEFAULT '2.0',
	"working_zone" text,
	"shift_timing_start" text,
	"shift_timing_end" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partner_society_assignments_partner_id_key" UNIQUE("partner_id")
);
--> statement-breakpoint
CREATE TABLE "partner_verification_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"action" text NOT NULL,
	"rejection_reason" text,
	"performed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_partner_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"overall_rating" numeric DEFAULT '5.00',
	"acceptance_rate" numeric DEFAULT '100.00',
	"completion_rate" numeric DEFAULT '100.00',
	"on_time_delivery_rate" numeric DEFAULT '100.00',
	"avg_delivery_time_minutes" integer DEFAULT 0,
	"today_score" integer DEFAULT 100,
	"weekly_score" integer DEFAULT 100,
	"monthly_score" integer DEFAULT 100,
	"lifetime_deliveries" integer DEFAULT 0,
	"days_worked" integer DEFAULT 0,
	"hours_online" numeric DEFAULT '0.00',
	"shift_completion_rate" numeric DEFAULT '100.00',
	"late_starts_count" integer DEFAULT 0,
	"break_compliance_rate" numeric DEFAULT '100.00',
	"package_handling_score" numeric DEFAULT '100.00',
	"customer_satisfaction_score" numeric DEFAULT '100.00',
	"order_accuracy_score" numeric DEFAULT '100.00',
	"professionalism_score" numeric DEFAULT '100.00',
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "delivery_partner_metrics_partner_id_key" UNIQUE("partner_id")
);
--> statement-breakpoint
CREATE TABLE "partner_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"badge_code" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"unlocked_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "partner_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"target_deliveries" integer NOT NULL,
	"completed_deliveries" integer DEFAULT 0,
	"projected_earnings" numeric DEFAULT '0.00' NOT NULL,
	"starts_at" date NOT NULL,
	"ends_at" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "partner_targets_target_type_check" CHECK (target_type = ANY (ARRAY['DAILY'::text, 'WEEKLY'::text, 'MONTHLY'::text]))
);
--> statement-breakpoint
CREATE TABLE "partner_vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"vehicle_type" text NOT NULL,
	"vehicle_number" text,
	"rc_url" text NOT NULL,
	"insurance_url" text NOT NULL,
	"puc_url" text,
	"photo_url" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partner_vehicles_partner_id_key" UNIQUE("partner_id"),
	CONSTRAINT "partner_vehicles_vehicle_type_check" CHECK (vehicle_type = ANY (ARRAY['BIKE'::text, 'SCOOTER'::text, 'CYCLE'::text, 'EV'::text, 'WALKING'::text])),
	CONSTRAINT "partner_vehicles_vehicle_number_check" CHECK ((vehicle_number IS NULL) OR (vehicle_number = ''::text) OR (vehicle_number ~* '^[a-z0-9\s\-]+$'::text)),
	CONSTRAINT "partner_vehicles_status_check" CHECK (status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text]))
);
--> statement-breakpoint
CREATE TABLE "partner_rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"reward_points_balance" integer DEFAULT 0,
	"total_points_earned" integer DEFAULT 0,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "partner_rewards_partner_id_key" UNIQUE("partner_id")
);
--> statement-breakpoint
CREATE TABLE "partner_penalties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"penalty_type" text NOT NULL,
	"amount" numeric DEFAULT '0.00',
	"reason" text NOT NULL,
	"warning_issued" boolean DEFAULT false,
	"status" text DEFAULT 'APPLIED',
	"appeal_reason" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "partner_penalties_status_check" CHECK (status = ANY (ARRAY['APPLIED'::text, 'APPEALED'::text, 'WAIVED'::text]))
);
--> statement-breakpoint
CREATE TABLE "reward_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"points_cost" integer NOT NULL,
	"reward_type" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "reward_catalog_reward_type_check" CHECK (reward_type = ANY (ARRAY['COUPON'::text, 'GIFT_VOUCHER'::text, 'RECOGNITION_CERTIFICATE'::text]))
);
--> statement-breakpoint
CREATE TABLE "emergency_sos_alarms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"order_id" uuid,
	"latitude" numeric NOT NULL,
	"longitude" numeric NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "emergency_sos_alarms_status_check" CHECK (status = ANY (ARRAY['ACTIVE'::text, 'RESOLVED'::text, 'FALSE_ALARM'::text]))
);
--> statement-breakpoint
CREATE TABLE "ticket_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"message" text NOT NULL,
	"media_url" text,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "learning_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"video_url" text NOT NULL,
	"duration_minutes" integer DEFAULT 5 NOT NULL,
	"category" text DEFAULT 'BEST_PRACTICES',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "partner_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"incident_type" text NOT NULL,
	"description" text NOT NULL,
	"evidence_url" text,
	"latitude" numeric,
	"longitude" numeric,
	"order_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "partner_incidents_incident_type_check" CHECK (incident_type = ANY (ARRAY['ACCIDENT'::text, 'VEHICLE_BREAKDOWN'::text, 'CUSTOMER_MISCONDUCT'::text, 'CHEF_MISCONDUCT'::text, 'FOOD_DAMAGE'::text, 'ROAD_CLOSURE'::text, 'SAFETY_HAZARD'::text, 'MEDICAL_EMERGENCY'::text]))
);
--> statement-breakpoint
CREATE TABLE "partner_incentives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"incentive_type" text NOT NULL,
	"title" text NOT NULL,
	"amount" numeric DEFAULT '0.00' NOT NULL,
	"status" text DEFAULT 'ELIGIBLE' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "partner_incentives_status_check" CHECK (status = ANY (ARRAY['ELIGIBLE'::text, 'INELIGIBLE'::text, 'CLAIMED'::text]))
);
--> statement-breakpoint
CREATE TABLE "faq_kb" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "faq_kb_category_check" CHECK (category = ANY (ARRAY['ORDER_PROCESS'::text, 'PICKUP'::text, 'DELIVERY'::text, 'PAYMENTS'::text, 'WALLET'::text, 'APP_USAGE'::text, 'SAFETY'::text, 'TROUBLESHOOTING'::text]))
);
--> statement-breakpoint
CREATE TABLE "partner_leaderboard" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"scope" text NOT NULL,
	"rank" integer NOT NULL,
	"score" integer NOT NULL,
	"completed_deliveries" integer DEFAULT 0,
	"rating" numeric DEFAULT '5.00',
	"as_of_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "partner_leaderboard_scope_check" CHECK (scope = ANY (ARRAY['SOCIETY'::text, 'CITY'::text, 'REGION'::text, 'COMPANY'::text]))
);
--> statement-breakpoint
CREATE TABLE "partner_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"reward_catalog_id" uuid,
	"code" text NOT NULL,
	"status" text DEFAULT 'ISSUED',
	"redeemed_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "partner_redemptions_status_check" CHECK (status = ANY (ARRAY['ISSUED'::text, 'REDEEMED'::text, 'EXPIRED'::text]))
);
--> statement-breakpoint
CREATE TABLE "partner_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"language" text DEFAULT 'en',
	"theme" text DEFAULT 'light',
	"notifications_enabled" boolean DEFAULT true,
	"biometrics_enabled" boolean DEFAULT false,
	"location_preferences" text DEFAULT 'ALWAYS',
	"map_preferences" text DEFAULT 'GOOGLE',
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "partner_settings_partner_id_key" UNIQUE("partner_id"),
	CONSTRAINT "partner_settings_language_check" CHECK (language = ANY (ARRAY['en'::text, 'hi'::text, 'kn'::text, 'ta'::text])),
	CONSTRAINT "partner_settings_theme_check" CHECK (theme = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text])),
	CONSTRAINT "partner_settings_location_preferences_check" CHECK (location_preferences = ANY (ARRAY['ALWAYS'::text, 'WHILE_USING'::text, 'DISABLED'::text])),
	CONSTRAINT "partner_settings_map_preferences_check" CHECK (map_preferences = ANY (ARRAY['GOOGLE'::text, 'APPLE'::text, 'OSM'::text]))
);
--> statement-breakpoint
CREATE TABLE "verification_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "verification_requests_status_check" CHECK (status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text]))
);
--> statement-breakpoint
CREATE TABLE "system_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid,
	"event_type" text NOT NULL,
	"severity" text DEFAULT 'INFO',
	"description" text NOT NULL,
	"api_latency" numeric,
	"battery_level" integer,
	"gps_status" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "system_audit_logs_severity_check" CHECK (severity = ANY (ARRAY['INFO'::text, 'WARNING'::text, 'ERROR'::text, 'CRITICAL'::text]))
);
--> statement-breakpoint
CREATE TABLE "compliance_docs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"version" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "compliance_docs_document_type_key" UNIQUE("document_type"),
	CONSTRAINT "compliance_docs_document_type_check" CHECK (document_type = ANY (ARRAY['PRIVACY_POLICY'::text, 'TERMS_OF_SERVICE'::text, 'PARTNER_AGREEMENT'::text, 'LICENSES'::text]))
);
--> statement-breakpoint
CREATE TABLE "device_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "device_tokens_token_key" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"promotional_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_profile_id_key" UNIQUE("profile_id")
);
--> statement-breakpoint
CREATE TABLE "verification_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid,
	"status" text NOT NULL,
	"notes" text,
	"performed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_partner_location" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"order_id" uuid,
	"latitude" numeric NOT NULL,
	"longitude" numeric NOT NULL,
	"accuracy" numeric,
	"heading" numeric,
	"speed" numeric,
	"battery_level" integer,
	"gps_provider" text,
	"captured_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"feedback_type" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'PENDING',
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "partner_feedback_feedback_type_check" CHECK (feedback_type = ANY (ARRAY['APP_FEEDBACK'::text, 'BUG_REPORT'::text, 'FEATURE_REQUEST'::text, 'GENERAL_SUGGESTION'::text])),
	CONSTRAINT "partner_feedback_status_check" CHECK (status = ANY (ARRAY['PENDING'::text, 'UNDER_REVIEW'::text, 'RESOLVED'::text]))
);
--> statement-breakpoint
CREATE TABLE "partner_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"device_name" text NOT NULL,
	"os_type" text NOT NULL,
	"app_version" text NOT NULL,
	"device_token" text,
	"last_login_at" timestamp with time zone DEFAULT now(),
	"last_sync_at" timestamp with time zone DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kitchen_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kitchen_id" uuid NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"documents_url" text[],
	"hygiene_records_url" text[],
	"verifier_id" uuid,
	"verification_notes" text,
	"verification_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kitchen_verifications_status_check" CHECK (status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text, 'REQUEST_RESUBMISSION'::text, 'SUSPENDED'::text]))
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_code" text,
	"customer_id" uuid,
	"kitchen_id" uuid,
	"status" text DEFAULT 'PLACED',
	"delivery_method" text DEFAULT 'DELIVERY_PARTNER',
	"delivery_fee" numeric DEFAULT '0',
	"list_price" numeric DEFAULT '0',
	"discount" numeric DEFAULT '0',
	"total_paid" numeric DEFAULT '0',
	"delivery_address" text,
	"allergy_tags" text[] DEFAULT '{"RAY"}',
	"allergy_other_text" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"delivery_partner_id" uuid,
	"item_total" numeric DEFAULT '0',
	"discount_amount" numeric DEFAULT '0',
	"taxes" numeric DEFAULT '0',
	"grand_total" numeric DEFAULT '0',
	"platform_commission" numeric DEFAULT '0',
	"net_chef_earnings" numeric DEFAULT '0',
	"tax_amount" numeric DEFAULT '0',
	"payment_status" text DEFAULT 'pending',
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"is_party_order" boolean DEFAULT false NOT NULL,
	"guest_count" integer,
	"per_head_price" numeric DEFAULT '0',
	"party_booking_date" timestamp with time zone,
	"selected_pack_name" text,
	"party_dishes" jsonb DEFAULT '[]'::jsonb,
	CONSTRAINT "orders_order_code_key" UNIQUE("order_code")
);
--> statement-breakpoint
CREATE TABLE "kitchens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chef_user_id" uuid,
	"name" text NOT NULL,
	"address" text,
	"bio" text,
	"specialty" text,
	"is_verified" boolean DEFAULT false,
	"is_top_rated" boolean DEFAULT false,
	"profile_image_url" text,
	"gallery_urls" text[] DEFAULT '{"RAY"}',
	"created_at" timestamp with time zone DEFAULT now(),
	"cover_image" text,
	"profile_image" text,
	"gallery" text[] DEFAULT '{"RAY"}',
	"videos" text[] DEFAULT '{"RAY"}',
	"kitchen_info" jsonb DEFAULT '{}'::jsonb,
	"story_prompts" jsonb DEFAULT '[]'::jsonb,
	"hygiene_details" jsonb DEFAULT '[]'::jsonb,
	"trust_badges" jsonb DEFAULT '[]'::jsonb,
	"stats" jsonb DEFAULT '{}'::jsonb,
	"chef_name" text,
	"society_id" uuid,
	"tower" text,
	"flat" text,
	"hide_identity" boolean DEFAULT false,
	"default_lead_time_minutes" integer DEFAULT 120,
	"bank_status" text DEFAULT 'pending',
	"hygiene_status" text DEFAULT 'pending',
	"is_live" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "partner_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"document_type" text NOT NULL,
	"document_url" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"expiry_date" date,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partner_documents_document_type_check" CHECK (document_type = ANY (ARRAY['aadhaar_front'::text, 'aadhaar_back'::text, 'pan_card'::text, 'license_front'::text, 'license_back'::text, 'passport'::text, 'selfie'::text])),
	CONSTRAINT "partner_documents_status_check" CHECK (status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text]))
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"actor_role" text,
	"action" text NOT NULL,
	"module" text NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"previous_data" jsonb,
	"new_data" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"status" text DEFAULT 'ASSIGNED' NOT NULL,
	"pickup_otp" text NOT NULL,
	"delivery_otp" text NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now(),
	"accepted_at" timestamp with time zone,
	"picked_up_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	CONSTRAINT "delivery_assignments_status_check" CHECK (status = ANY (ARRAY['ASSIGNED'::text, 'ACCEPTED'::text, 'REJECTED'::text, 'AT_PICKUP'::text, 'PICKED_UP'::text, 'OUT_FOR_DELIVERY'::text, 'REACHED_CUSTOMER'::text, 'DELIVERED'::text, 'CANCELLED'::text, 'FAILED'::text]))
);
--> statement-breakpoint
CREATE TABLE "delivery_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"lat" numeric NOT NULL,
	"lng" numeric NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "delivery_earnings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"amount" numeric NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "delivery_earnings_status_check" CHECK (status = ANY (ARRAY['PENDING'::text, 'PAID'::text]))
);
--> statement-breakpoint
CREATE TABLE "payout_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kitchen_id" uuid NOT NULL,
	"amount" numeric NOT NULL,
	"bank_details" jsonb NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"reference_id" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "payout_requests_amount_check" CHECK (amount > (0)::numeric),
	CONSTRAINT "payout_requests_status_check" CHECK (status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'PROCESSING'::text, 'COMPLETED'::text, 'FAILED'::text, 'REJECTED'::text]))
);
--> statement-breakpoint
CREATE TABLE "party_menus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kitchen_id" uuid NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"min_guests" integer DEFAULT 10 NOT NULL,
	"advance_notice_hours" integer DEFAULT 24 NOT NULL,
	"packages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"dishes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "party_menus_kitchen_id_key" UNIQUE("kitchen_id")
);
--> statement-breakpoint
ALTER TABLE "dishes" ADD CONSTRAINT "dishes_kitchen_id_fkey" FOREIGN KEY ("kitchen_id") REFERENCES "public"."kitchens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_threads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_dish_id_fkey" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_dishes" ADD CONSTRAINT "weekly_dishes_kitchen_id_fkey" FOREIGN KEY ("kitchen_id") REFERENCES "public"."kitchens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_consumer_id_fkey" FOREIGN KEY ("consumer_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_kitchen_id_fkey" FOREIGN KEY ("kitchen_id") REFERENCES "public"."kitchens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_kitchen_id_fkey" FOREIGN KEY ("kitchen_id") REFERENCES "public"."kitchens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_consumer_id_fkey" FOREIGN KEY ("consumer_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_partners" ADD CONSTRAINT "delivery_partners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_agent_id_fkey" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_kitchen_id_fkey" FOREIGN KEY ("kitchen_id") REFERENCES "public"."kitchens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_adjustments" ADD CONSTRAINT "financial_adjustments_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_adjustments" ADD CONSTRAINT "financial_adjustments_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_cases" ADD CONSTRAINT "dispute_cases_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_cases" ADD CONSTRAINT "dispute_cases_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_cases" ADD CONSTRAINT "dispute_cases_kitchen_id_fkey" FOREIGN KEY ("kitchen_id") REFERENCES "public"."kitchens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_cases" ADD CONSTRAINT "dispute_cases_assigned_agent_id_fkey" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_comments" ADD CONSTRAINT "dispute_comments_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "public"."dispute_cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_comments" ADD CONSTRAINT "dispute_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_bank_accounts" ADD CONSTRAINT "partner_bank_accounts_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_emergency_contacts" ADD CONSTRAINT "partner_emergency_contacts_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_society_assignments" ADD CONSTRAINT "partner_society_assignments_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_society_assignments" ADD CONSTRAINT "partner_society_assignments_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "public"."societies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_verification_logs" ADD CONSTRAINT "partner_verification_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_verification_logs" ADD CONSTRAINT "partner_verification_logs_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_partner_metrics" ADD CONSTRAINT "delivery_partner_metrics_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_badges" ADD CONSTRAINT "partner_badges_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_targets" ADD CONSTRAINT "partner_targets_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_vehicles" ADD CONSTRAINT "partner_vehicles_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_rewards" ADD CONSTRAINT "partner_rewards_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_penalties" ADD CONSTRAINT "partner_penalties_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_sos_alarms" ADD CONSTRAINT "emergency_sos_alarms_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_sos_alarms" ADD CONSTRAINT "emergency_sos_alarms_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_incidents" ADD CONSTRAINT "partner_incidents_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_incidents" ADD CONSTRAINT "partner_incidents_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_incentives" ADD CONSTRAINT "partner_incentives_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_leaderboard" ADD CONSTRAINT "partner_leaderboard_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_redemptions" ADD CONSTRAINT "partner_redemptions_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_redemptions" ADD CONSTRAINT "partner_redemptions_reward_catalog_id_fkey" FOREIGN KEY ("reward_catalog_id") REFERENCES "public"."reward_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_settings" ADD CONSTRAINT "partner_settings_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_audit_logs" ADD CONSTRAINT "system_audit_logs_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_history" ADD CONSTRAINT "verification_history_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."verification_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_history" ADD CONSTRAINT "verification_history_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_partner_location" ADD CONSTRAINT "delivery_partner_location_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_partner_location" ADD CONSTRAINT "delivery_partner_location_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_feedback" ADD CONSTRAINT "partner_feedback_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_devices" ADD CONSTRAINT "partner_devices_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kitchen_verifications" ADD CONSTRAINT "kitchen_verifications_kitchen_id_fkey" FOREIGN KEY ("kitchen_id") REFERENCES "public"."kitchens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kitchen_verifications" ADD CONSTRAINT "kitchen_verifications_verifier_id_fkey" FOREIGN KEY ("verifier_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_kitchen_id_fkey" FOREIGN KEY ("kitchen_id") REFERENCES "public"."kitchens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_delivery_partner" FOREIGN KEY ("delivery_partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kitchens" ADD CONSTRAINT "kitchens_chef_user_id_fkey" FOREIGN KEY ("chef_user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_documents" ADD CONSTRAINT "partner_documents_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_assignments" ADD CONSTRAINT "delivery_assignments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_assignments" ADD CONSTRAINT "delivery_assignments_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_tracking" ADD CONSTRAINT "delivery_tracking_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."delivery_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_earnings" ADD CONSTRAINT "delivery_earnings_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."delivery_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_earnings" ADD CONSTRAINT "delivery_earnings_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_kitchen_id_fkey" FOREIGN KEY ("kitchen_id") REFERENCES "public"."kitchens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "party_menus" ADD CONSTRAINT "party_menus_kitchen_id_fkey" FOREIGN KEY ("kitchen_id") REFERENCES "public"."kitchens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_orders_is_party_order" ON "orders" USING btree ("is_party_order" bool_ops) WHERE (is_party_order = true);--> statement-breakpoint
CREATE INDEX "idx_payout_requests_kitchen_id" ON "payout_requests" USING btree ("kitchen_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_payout_requests_status" ON "payout_requests" USING btree ("status" text_ops);
*/