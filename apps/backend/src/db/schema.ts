import { pgTable, foreignKey, primaryKey, uuid, text, numeric, integer, boolean, timestamp, check, date, unique, jsonb, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const dishes = pgTable("dishes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	kitchenId: uuid("kitchen_id"),
	name: text().notNull(),
	category: text().default('Homestyle'),
	price: numeric({ mode: 'number' }).notNull(),
	dietType: text("diet_type").default('VEG'),
	prepTimeMinutes: integer("prep_time_minutes").default(120),
	tags: text().array().default([]),
	isAvailable: boolean("is_available").default(true),
	isFree: boolean("is_free").default(false),
	imageUrl: text("image_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.kitchenId],
			foreignColumns: [kitchens.id],
			name: "dishes_kitchen_id_fkey"
		}),
]);

export const chatMessages = pgTable("chat_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	threadId: uuid("thread_id"),
	senderId: uuid("sender_id"),
	body: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	mediaUrl: text("media_url"),
	isRead: boolean("is_read").default(false).notNull(),
	status: text().default('SENT').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.threadId],
			foreignColumns: [chatThreads.id],
			name: "chat_messages_thread_id_fkey"
		}),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [profiles.id],
			name: "chat_messages_sender_id_fkey"
		}),
	check("chat_messages_status_check", sql`status = ANY (ARRAY['SENT'::text, 'DELIVERED'::text, 'READ'::text])`),
]);

export const orderItems = pgTable("order_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id"),
	dishId: uuid("dish_id"),
	dishNameSnapshot: text("dish_name_snapshot"),
	priceSnapshot: numeric("price_snapshot", { mode: 'number' }),
	quantity: integer().default(1),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	// Hand-added, not introspected — see supabase/local/026_order_items_weekly_dish_id.sql
	weeklyDishId: uuid("weekly_dish_id"),
	// Hand-added, not introspected — see supabase/local/027_dish_addons.sql
	addons: jsonb().notNull().default([]),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_fkey"
		}),
	foreignKey({
			columns: [table.dishId],
			foreignColumns: [dishes.id],
			name: "order_items_dish_id_fkey"
		}),
]);

// Hand-added, not introspected — see supabase/local/027_dish_addons.sql
export const dishAddons = pgTable("dish_addons", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dishId: uuid("dish_id").notNull(),
	name: text().notNull(),
	price: numeric({ mode: 'number' }).notNull().default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.dishId],
			foreignColumns: [dishes.id],
			name: "dish_addons_dish_id_fkey"
		}).onDelete("cascade"),
]);

export const weeklyDishes = pgTable("weekly_dishes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	kitchenId: uuid("kitchen_id"),
	day: text().notNull(),
	dishName: text("dish_name").notNull(),
	category: text().default('Veg'),
	mealType: text("meal_type").default('Lunch'),
	price: numeric({ mode: 'number' }).notNull(),
	quantity: integer().default(10),
	remainingQuantity: integer("remaining_quantity").default(10),
	description: text(),
	closeTime: text("close_time").default('6:00 PM'),
	status: text().default('open'),
	weekStartDate: date("week_start_date"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.kitchenId],
			foreignColumns: [kitchens.id],
			name: "weekly_dishes_kitchen_id_fkey"
		}),
]);

export const chatThreads = pgTable("chat_threads", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	consumerId: uuid("consumer_id"),
	kitchenId: uuid("kitchen_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.consumerId],
			foreignColumns: [profiles.id],
			name: "chat_threads_consumer_id_fkey"
		}),
	foreignKey({
			columns: [table.kitchenId],
			foreignColumns: [kitchens.id],
			name: "chat_threads_kitchen_id_fkey"
		}),
]);

export const supplyItems = pgTable("supply_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	unit: text().default('kg'),
	price: numeric({ mode: 'number' }).default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const reviews = pgTable("reviews", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	orderId: text("order_id").notNull(),
	kitchenId: text("kitchen_id").notNull(),
	kitchenName: text("kitchen_name"),
	dishId: text("dish_id"),
	dishName: text("dish_name"),
	rating: integer().notNull(),
	comment: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	consumerId: uuid("consumer_id"),
	customerId: uuid("customer_id"),
}, (table) => [
	check("reviews_rating_check", sql`(rating >= 1) AND (rating <= 5)`),
]);

export const profiles = pgTable("profiles", {
	id: uuid().primaryKey().notNull(),
	phone: text(),
	name: text(),
	displayName: text("display_name"),
	society: text(),
	role: text().default('consumer'),
	roles: text().array().default(['consumer']),
	activeRole: text("active_role").default('consumer'),
	chefProfileId: uuid("chef_profile_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	flat: text(),
	status: text().default('active'),
	email: text(),
	latitude: numeric({ mode: 'number' }),
	longitude: numeric({ mode: 'number' }),
	// Hand-added, not introspected — see supabase/local/022_profile_password_hash.sql
	passwordHash: text("password_hash"),
	// Hand-added, not introspected — see supabase/local/024_profile_avatar_cover.sql
	avatarUrl: text("avatar_url"),
	coverImage: text("cover_image"),
});

// Hand-added, not introspected — see supabase/local/025_payments_webhooks_table.sql
export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: text("order_id").notNull(),
	consumerId: uuid("consumer_id").notNull(),
	paymentGateway: text("payment_gateway"),
	cfOrderId: text("cf_order_id"),
	paymentSessionId: text("payment_session_id"),
	cfPaymentId: text("cf_payment_id"),
	razorpayOrderId: text("razorpay_order_id"),
	razorpayPaymentId: text("razorpay_payment_id"),
	razorpaySignature: text("razorpay_signature"),
	amount: numeric({ mode: 'number' }).notNull(),
	currency: text().default('INR').notNull(),
	paymentMethod: text("payment_method"),
	paymentStatus: text("payment_status").default('PENDING').notNull(),
	paymentTimestamp: timestamp("payment_timestamp", { withTimezone: true, mode: 'string' }),
	refundStatus: text("refund_status"),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

// Hand-added, not introspected — see supabase/local/025_payments_webhooks_table.sql
export const webhookEvents = pgTable("webhook_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	eventId: text("event_id").notNull().unique(),
	eventType: text("event_type").notNull(),
	cfOrderId: text("cf_order_id"),
	payload: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const settlements = pgTable("settlements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	kitchenId: uuid("kitchen_id").notNull(),
	totalSales: numeric("total_sales", { mode: 'number' }).default(0).notNull(),
	platformCommission: numeric("platform_commission", { mode: 'number' }).default(0).notNull(),
	gatewayFees: numeric("gateway_fees", { mode: 'number' }).default(0).notNull(),
	taxes: numeric({ mode: 'number' }).default(0).notNull(),
	refundAdjustments: numeric("refund_adjustments", { mode: 'number' }).default(0).notNull(),
	netPayable: numeric("net_payable", { mode: 'number' }).default(0).notNull(),
	status: text().default('PENDING').notNull(),
	settlementMode: text("settlement_mode").default('weekly').notNull(),
	periodStart: date("period_start"),
	periodEnd: date("period_end"),
	expectedAt: timestamp("expected_at", { withTimezone: true, mode: 'string' }),
	heldTransactionId: uuid("held_transaction_id"),
	failureReason: text("failure_reason"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.kitchenId],
			foreignColumns: [kitchens.id],
			name: "settlements_kitchen_id_fkey"
		}),
]);

export const addresses = pgTable("addresses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	consumerId: uuid("consumer_id").notNull(),
	label: text().notNull(),
	fullAddress: text("full_address").notNull(),
	latitude: numeric({ mode: 'number' }),
	longitude: numeric({ mode: 'number' }),
	isDefault: boolean("is_default").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.consumerId],
			foreignColumns: [profiles.id],
			name: "addresses_consumer_id_fkey"
		}),
]);

export const societies = pgTable("societies", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	city: text().notNull(),
	lat: numeric({ mode: 'number' }),
	lng: numeric({ mode: 'number' }),
	address: text(),
	state: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const deliveryPartners = pgTable("delivery_partners", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	vehicleType: text("vehicle_type").notNull(),
	status: text().default('OFFLINE').notNull(),
	currentLatitude: numeric("current_latitude", { mode: 'number' }),
	currentLongitude: numeric("current_longitude", { mode: 'number' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	gender: text(),
	dateOfBirth: date("date_of_birth"),
	bloodGroup: text("blood_group"),
	preferredLanguage: text("preferred_language").default('English'),
	profilePhotoUrl: text("profile_photo_url"),
	permanentAddress: text("permanent_address"),
	currentAddress: text("current_address"),
	city: text(),
	state: text(),
	pincode: text(),
	landmark: text(),
	kycStatus: text("kyc_status").default('PENDING'),
	rejectionReason: text("rejection_reason"),
	experiencePoints: integer("experience_points").default(0),
	partnerLevel: integer("partner_level").default(1),
	// Hand-added, not introspected — see supabase/local/005_delivery_partner_online_columns.sql
	isOnline: boolean("is_online").default(false).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "delivery_partners_user_id_fkey"
		}),
	check("delivery_partners_kyc_status_check", sql`kyc_status = ANY (ARRAY['PENDING'::text, 'UNDER_REVIEW'::text, 'APPROVED'::text, 'REJECTED'::text, 'EXPIRED'::text])`),
]);

export const wallets = pgTable("wallets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id"),
	userId: uuid("user_id"),
	role: text(),
	walletType: text("wallet_type"),
	balance: numeric({ mode: 'number' }).default(0.00).notNull(),
	currency: text().default('INR').notNull(),
	status: text().default('ACTIVE').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "wallets_profile_id_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "wallets_user_id_fkey"
		}),
	check("wallets_role_check", sql`role = ANY (ARRAY['consumer'::text, 'chef'::text])`),
	check("wallets_wallet_type_check", sql`wallet_type = ANY (ARRAY['CONSUMER'::text, 'CHEF'::text, 'PLATFORM'::text])`),
]);

export const walletTransactions = pgTable("wallet_transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	transactionId: uuid("transaction_id"),
	walletId: uuid("wallet_id").notNull(),
	amount: numeric({ mode: 'number' }).notNull(),
	type: text().notNull(),
	source: text(),
	referenceId: text("reference_id"),
	orderId: uuid("order_id"),
	paymentId: uuid("payment_id"),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.walletId],
			foreignColumns: [wallets.id],
			name: "wallet_transactions_wallet_id_fkey"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "wallet_transactions_order_id_fkey"
		}),
]);

export const coupons = pgTable("coupons", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	code: text().notNull(),
	discountType: text("discount_type").notNull(),
	discountValue: numeric("discount_value", { mode: 'number' }).notNull(),
	minOrderValue: numeric("min_order_value", { mode: 'number' }).default(0).notNull(),
	maxDiscount: numeric("max_discount", { mode: 'number' }),
	startsAt: timestamp("starts_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	endsAt: timestamp("ends_at", { withTimezone: true, mode: 'string' }),
	isActive: boolean("is_active").default(true).notNull(),
	// Hand-added, not introspected — see supabase/local/006_coupon_system_columns.sql
	usageLimit: integer("usage_limit"),
	currentUsage: integer("current_usage").default(0).notNull(),
	societyId: uuid("society_id"),
	kitchenId: uuid("kitchen_id"),
}, (table) => [
	unique("coupons_code_key").on(table.code),
	check("coupons_discount_type_check", sql`discount_type = ANY (ARRAY['PERCENTAGE'::text, 'FIXED'::text, 'FLAT'::text, 'FREE_DELIVERY'::text])`),
	foreignKey({
			columns: [table.societyId],
			foreignColumns: [societies.id],
			name: "coupons_society_id_fkey"
		}),
	foreignKey({
			columns: [table.kitchenId],
			foreignColumns: [kitchens.id],
			name: "coupons_kitchen_id_fkey"
		}),
]);

// Hand-added, not introspected — see supabase/local/006_coupon_system_columns.sql
export const couponUsage = pgTable("coupon_usage", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	couponId: uuid("coupon_id").notNull(),
	profileId: uuid("profile_id"),
	orderId: uuid("order_id"),
	discountApplied: numeric("discount_applied", { mode: 'number' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.couponId],
			foreignColumns: [coupons.id],
			name: "coupon_usage_coupon_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "coupon_usage_profile_id_fkey"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "coupon_usage_order_id_fkey"
		}),
]);

export const tickets = pgTable("tickets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	subject: text().notNull(),
	description: text().notNull(),
	status: text().default('OPEN').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	category: text(),
	priority: text().default('MEDIUM'),
	orderId: uuid("order_id"),
	assignedAgentId: uuid("assigned_agent_id"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "tickets_profile_id_fkey"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "tickets_order_id_fkey"
		}),
	foreignKey({
			columns: [table.assignedAgentId],
			foreignColumns: [profiles.id],
			name: "tickets_assigned_agent_id_fkey"
		}),
	check("tickets_category_check", sql`category = ANY (ARRAY['DELIVERY_ISSUE'::text, 'PICKUP_ISSUE'::text, 'CUSTOMER_ISSUE'::text, 'CHEF_ISSUE'::text, 'PAYMENT_ISSUE'::text, 'WALLET_ISSUE'::text, 'TECHNICAL_ISSUE'::text, 'ACCOUNT_ISSUE'::text, 'SAFETY_ISSUE'::text, 'EMERGENCY'::text, 'OTHER'::text])`),
	check("tickets_priority_check", sql`priority = ANY (ARRAY['LOW'::text, 'MEDIUM'::text, 'HIGH'::text, 'URGENT'::text])`),
]);

export const refunds = pgTable("refunds", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	refundCode: text("refund_code").notNull(),
	orderId: uuid("order_id"),
	customerId: uuid("customer_id"),
	kitchenId: uuid("kitchen_id"),
	paymentId: text("payment_id"),
	amount: numeric({ mode: 'number' }).notNull(),
	type: text().notNull(),
	reason: text().notNull(),
	status: text().default('PENDING').notNull(),
	requestedBy: uuid("requested_by"),
	approvedBy: uuid("approved_by"),
	processedBy: uuid("processed_by"),
	refundReference: text("refund_reference"),
	gatewayRefundId: text("gateway_refund_id"),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "refunds_order_id_fkey"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [profiles.id],
			name: "refunds_customer_id_fkey"
		}),
	foreignKey({
			columns: [table.kitchenId],
			foreignColumns: [kitchens.id],
			name: "refunds_kitchen_id_fkey"
		}),
	foreignKey({
			columns: [table.requestedBy],
			foreignColumns: [profiles.id],
			name: "refunds_requested_by_fkey"
		}),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [profiles.id],
			name: "refunds_approved_by_fkey"
		}),
	foreignKey({
			columns: [table.processedBy],
			foreignColumns: [profiles.id],
			name: "refunds_processed_by_fkey"
		}),
	unique("refunds_refund_code_key").on(table.refundCode),
	check("refunds_amount_check", sql`amount > (0)::numeric`),
	check("refunds_type_check", sql`type = ANY (ARRAY['FULL'::text, 'PARTIAL'::text, 'MANUAL'::text, 'AUTOMATIC'::text])`),
	check("refunds_status_check", sql`status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'PROCESSING'::text, 'COMPLETED'::text, 'FAILED'::text, 'REJECTED'::text])`),
]);

export const financialAdjustments = pgTable("financial_adjustments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	adjustmentCode: text("adjustment_code").notNull(),
	adjustmentType: text("adjustment_type").notNull(),
	targetType: text("target_type").notNull(),
	targetId: uuid("target_id"),
	amount: numeric({ mode: 'number' }).notNull(),
	entryType: text("entry_type").notNull(),
	reason: text().notNull(),
	requestedBy: uuid("requested_by"),
	approvedBy: uuid("approved_by"),
	referenceEntityType: text("reference_entity_type"),
	referenceEntityId: text("reference_entity_id"),
	supportingNotes: text("supporting_notes"),
	status: text().default('APPROVED').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.requestedBy],
			foreignColumns: [profiles.id],
			name: "financial_adjustments_requested_by_fkey"
		}),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [profiles.id],
			name: "financial_adjustments_approved_by_fkey"
		}),
	unique("financial_adjustments_adjustment_code_key").on(table.adjustmentCode),
	check("financial_adjustments_adjustment_type_check", sql`adjustment_type = ANY (ARRAY['COMMISSION_CORRECTION'::text, 'SETTLEMENT_CORRECTION'::text, 'WALLET_CORRECTION'::text, 'TAX_ADJUSTMENT'::text, 'DELIVERY_CHARGE_ADJUSTMENT'::text, 'MANUAL_ACCOUNTING_ENTRY'::text, 'REFUND_ADJUSTMENT'::text, 'SETTLEMENT_REVERSAL'::text, 'PENALTY'::text, 'CHARGEBACK'::text, 'BONUS'::text, 'INCENTIVE'::text])`),
	check("financial_adjustments_target_type_check", sql`target_type = ANY (ARRAY['CHEF'::text, 'CUSTOMER'::text, 'PLATFORM'::text])`),
	check("financial_adjustments_entry_type_check", sql`entry_type = ANY (ARRAY['CREDIT'::text, 'DEBIT'::text])`),
	check("financial_adjustments_status_check", sql`status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text])`),
]);

export const disputeCases = pgTable("dispute_cases", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	disputeCode: text("dispute_code").notNull(),
	orderId: uuid("order_id"),
	customerId: uuid("customer_id"),
	kitchenId: uuid("kitchen_id"),
	category: text().notNull(),
	status: text().default('PENDING').notNull(),
	priority: text().default('MEDIUM').notNull(),
	assignedAgentId: uuid("assigned_agent_id"),
	description: text().notNull(),
	resolutionNotes: text("resolution_notes"),
	resolutionTimeMinutes: integer("resolution_time_minutes"),
	resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "dispute_cases_order_id_fkey"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [profiles.id],
			name: "dispute_cases_customer_id_fkey"
		}),
	foreignKey({
			columns: [table.kitchenId],
			foreignColumns: [kitchens.id],
			name: "dispute_cases_kitchen_id_fkey"
		}),
	foreignKey({
			columns: [table.assignedAgentId],
			foreignColumns: [profiles.id],
			name: "dispute_cases_assigned_agent_id_fkey"
		}),
	unique("dispute_cases_dispute_code_key").on(table.disputeCode),
	check("dispute_cases_category_check", sql`category = ANY (ARRAY['INCORRECT_CHARGE'::text, 'MISSING_REFUND'::text, 'DUPLICATE_PAYMENT'::text, 'WRONG_SETTLEMENT'::text, 'WRONG_COMMISSION'::text, 'FAILED_PAYOUT'::text, 'FRAUD_REVIEW'::text])`),
	check("dispute_cases_status_check", sql`status = ANY (ARRAY['PENDING'::text, 'INVESTIGATING'::text, 'RESOLVED'::text, 'REJECTED'::text])`),
	check("dispute_cases_priority_check", sql`priority = ANY (ARRAY['LOW'::text, 'MEDIUM'::text, 'HIGH'::text, 'URGENT'::text])`),
]);

export const disputeComments = pgTable("dispute_comments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	disputeId: uuid("dispute_id").notNull(),
	authorId: uuid("author_id"),
	authorRole: text("author_role"),
	comment: text().notNull(),
	isInternal: boolean("is_internal").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.disputeId],
			foreignColumns: [disputeCases.id],
			name: "dispute_comments_dispute_id_fkey"
		}),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [profiles.id],
			name: "dispute_comments_author_id_fkey"
		}),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	title: text().notNull(),
	message: text().notNull(),
	type: text().notNull(),
	isRead: boolean("is_read").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	userId: uuid("user_id"),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "notifications_profile_id_fkey"
		}),
]);

export const partnerBankAccounts = pgTable("partner_bank_accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	partnerId: uuid("partner_id").notNull(),
	holderName: text("holder_name").notNull(),
	bankName: text("bank_name").notNull(),
	accountNumber: text("account_number").notNull(),
	ifscCode: text("ifsc_code"),
	upiId: text("upi_id"),
	chequeUrl: text("cheque_url").notNull(),
	status: text().default('PENDING').notNull(),
	rejectionReason: text("rejection_reason"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "partner_bank_accounts_partner_id_fkey"
		}),
	unique("partner_bank_accounts_partner_id_key").on(table.partnerId),
	check("partner_bank_accounts_ifsc_code_check", sql`(ifsc_code IS NULL) OR (ifsc_code = ''::text) OR (ifsc_code ~* '^[A-Z]{4}0[A-Z0-9]{6}$'::text)`),
	check("partner_bank_accounts_status_check", sql`status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text])`),
]);

export const partnerEmergencyContacts = pgTable("partner_emergency_contacts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	partnerId: uuid("partner_id").notNull(),
	primaryName: text("primary_name").notNull(),
	primaryPhone: text("primary_phone").notNull(),
	primaryRelationship: text("primary_relationship").notNull(),
	secondaryName: text("secondary_name"),
	secondaryPhone: text("secondary_phone"),
	secondaryRelationship: text("secondary_relationship"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "partner_emergency_contacts_partner_id_fkey"
		}),
	unique("partner_emergency_contacts_partner_id_key").on(table.partnerId),
]);

export const partnerSocietyAssignments = pgTable("partner_society_assignments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	partnerId: uuid("partner_id").notNull(),
	societyId: uuid("society_id").notNull(),
	towerCoverage: text("tower_coverage").array().default([]),
	deliveryRadiusKm: numeric("delivery_radius_km", { mode: 'number' }).default(2.0),
	workingZone: text("working_zone"),
	shiftTimingStart: text("shift_timing_start"),
	shiftTimingEnd: text("shift_timing_end"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "partner_society_assignments_partner_id_fkey"
		}),
	foreignKey({
			columns: [table.societyId],
			foreignColumns: [societies.id],
			name: "partner_society_assignments_society_id_fkey"
		}),
	unique("partner_society_assignments_partner_id_key").on(table.partnerId),
]);

export const partnerVerificationLogs = pgTable("partner_verification_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	partnerId: uuid("partner_id").notNull(),
	action: text().notNull(),
	rejectionReason: text("rejection_reason"),
	performedBy: uuid("performed_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.performedBy],
			foreignColumns: [profiles.id],
			name: "partner_verification_logs_performed_by_fkey"
		}),
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "partner_verification_logs_partner_id_fkey"
		}),
]);

export const deliveryPartnerMetrics = pgTable("delivery_partner_metrics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	partnerId: uuid("partner_id").notNull(),
	overallRating: numeric("overall_rating", { mode: 'number' }).default(5.00),
	acceptanceRate: numeric("acceptance_rate", { mode: 'number' }).default(100.00),
	completionRate: numeric("completion_rate", { mode: 'number' }).default(100.00),
	onTimeDeliveryRate: numeric("on_time_delivery_rate", { mode: 'number' }).default(100.00),
	avgDeliveryTimeMinutes: integer("avg_delivery_time_minutes").default(0),
	todayScore: integer("today_score").default(100),
	weeklyScore: integer("weekly_score").default(100),
	monthlyScore: integer("monthly_score").default(100),
	lifetimeDeliveries: integer("lifetime_deliveries").default(0),
	daysWorked: integer("days_worked").default(0),
	hoursOnline: numeric("hours_online", { mode: 'number' }).default(0.00),
	shiftCompletionRate: numeric("shift_completion_rate", { mode: 'number' }).default(100.00),
	lateStartsCount: integer("late_starts_count").default(0),
	breakComplianceRate: numeric("break_compliance_rate", { mode: 'number' }).default(100.00),
	packageHandlingScore: numeric("package_handling_score", { mode: 'number' }).default(100.00),
	customerSatisfactionScore: numeric("customer_satisfaction_score", { mode: 'number' }).default(100.00),
	orderAccuracyScore: numeric("order_accuracy_score", { mode: 'number' }).default(100.00),
	professionalismScore: numeric("professionalism_score", { mode: 'number' }).default(100.00),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "delivery_partner_metrics_partner_id_fkey"
		}),
	unique("delivery_partner_metrics_partner_id_key").on(table.partnerId),
]);

export const partnerBadges = pgTable("partner_badges", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	partnerId: uuid("partner_id").notNull(),
	badgeCode: text("badge_code").notNull(),
	title: text().notNull(),
	description: text(),
	unlockedAt: timestamp("unlocked_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "partner_badges_partner_id_fkey"
		}),
]);

export const partnerTargets = pgTable("partner_targets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	partnerId: uuid("partner_id").notNull(),
	targetType: text("target_type").notNull(),
	targetDeliveries: integer("target_deliveries").notNull(),
	completedDeliveries: integer("completed_deliveries").default(0),
	projectedEarnings: numeric("projected_earnings", { mode: 'number' }).default(0.00).notNull(),
	startsAt: date("starts_at").notNull(),
	endsAt: date("ends_at").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "partner_targets_partner_id_fkey"
		}),
	check("partner_targets_target_type_check", sql`target_type = ANY (ARRAY['DAILY'::text, 'WEEKLY'::text, 'MONTHLY'::text])`),
]);

export const partnerVehicles = pgTable("partner_vehicles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	partnerId: uuid("partner_id").notNull(),
	vehicleType: text("vehicle_type").notNull(),
	vehicleNumber: text("vehicle_number"),
	rcUrl: text("rc_url").notNull(),
	insuranceUrl: text("insurance_url").notNull(),
	pucUrl: text("puc_url"),
	photoUrl: text("photo_url"),
	status: text().default('PENDING').notNull(),
	rejectionReason: text("rejection_reason"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "partner_vehicles_partner_id_fkey"
		}),
	unique("partner_vehicles_partner_id_key").on(table.partnerId),
	check("partner_vehicles_vehicle_type_check", sql`vehicle_type = ANY (ARRAY['BIKE'::text, 'SCOOTER'::text, 'CYCLE'::text, 'EV'::text, 'WALKING'::text])`),
	check("partner_vehicles_vehicle_number_check", sql`(vehicle_number IS NULL) OR (vehicle_number = ''::text) OR (vehicle_number ~* '^[a-z0-9\s\-]+$'::text)`),
	check("partner_vehicles_status_check", sql`status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text])`),
]);

export const partnerRewards = pgTable("partner_rewards", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	partnerId: uuid("partner_id").notNull(),
	rewardPointsBalance: integer("reward_points_balance").default(0),
	totalPointsEarned: integer("total_points_earned").default(0),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "partner_rewards_partner_id_fkey"
		}),
	unique("partner_rewards_partner_id_key").on(table.partnerId),
]);

export const partnerPenalties = pgTable("partner_penalties", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	partnerId: uuid("partner_id").notNull(),
	penaltyType: text("penalty_type").notNull(),
	amount: numeric({ mode: 'number' }).default(0.00),
	reason: text().notNull(),
	warningIssued: boolean("warning_issued").default(false),
	status: text().default('APPLIED'),
	appealReason: text("appeal_reason"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "partner_penalties_partner_id_fkey"
		}),
	check("partner_penalties_status_check", sql`status = ANY (ARRAY['APPLIED'::text, 'APPEALED'::text, 'WAIVED'::text])`),
]);

export const rewardCatalog = pgTable("reward_catalog", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	pointsCost: integer("points_cost").notNull(),
	rewardType: text("reward_type").notNull(),
	isActive: boolean("is_active").default(true),
	imageUrl: text("image_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	check("reward_catalog_reward_type_check", sql`reward_type = ANY (ARRAY['COUPON'::text, 'GIFT_VOUCHER'::text, 'RECOGNITION_CERTIFICATE'::text])`),
]);

export const emergencySosAlarms = pgTable("emergency_sos_alarms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	partnerId: uuid("partner_id").notNull(),
	orderId: uuid("order_id"),
	latitude: numeric({ mode: 'number' }).notNull(),
	longitude: numeric({ mode: 'number' }).notNull(),
	status: text().default('ACTIVE').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "emergency_sos_alarms_partner_id_fkey"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "emergency_sos_alarms_order_id_fkey"
		}),
	check("emergency_sos_alarms_status_check", sql`status = ANY (ARRAY['ACTIVE'::text, 'RESOLVED'::text, 'FALSE_ALARM'::text])`),
]);

export const ticketMessages = pgTable("ticket_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ticketId: uuid("ticket_id").notNull(),
	senderId: uuid("sender_id").notNull(),
	message: text().notNull(),
	mediaUrl: text("media_url"),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.ticketId],
			foreignColumns: [tickets.id],
			name: "ticket_messages_ticket_id_fkey"
		}),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [profiles.id],
			name: "ticket_messages_sender_id_fkey"
		}),
]);

export const learningVideos = pgTable("learning_videos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	videoUrl: text("video_url").notNull(),
	durationMinutes: integer("duration_minutes").default(5).notNull(),
	category: text().default('BEST_PRACTICES'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const partnerIncidents = pgTable("partner_incidents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	partnerId: uuid("partner_id").notNull(),
	incidentType: text("incident_type").notNull(),
	description: text().notNull(),
	evidenceUrl: text("evidence_url"),
	latitude: numeric({ mode: 'number' }),
	longitude: numeric({ mode: 'number' }),
	orderId: uuid("order_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "partner_incidents_partner_id_fkey"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "partner_incidents_order_id_fkey"
		}),
	check("partner_incidents_incident_type_check", sql`incident_type = ANY (ARRAY['ACCIDENT'::text, 'VEHICLE_BREAKDOWN'::text, 'CUSTOMER_MISCONDUCT'::text, 'CHEF_MISCONDUCT'::text, 'FOOD_DAMAGE'::text, 'ROAD_CLOSURE'::text, 'SAFETY_HAZARD'::text, 'MEDICAL_EMERGENCY'::text])`),
]);

export const partnerIncentives = pgTable("partner_incentives", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	partnerId: uuid("partner_id").notNull(),
	incentiveType: text("incentive_type").notNull(),
	title: text().notNull(),
	amount: numeric({ mode: 'number' }).default(0.00).notNull(),
	status: text().default('ELIGIBLE').notNull(),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "partner_incentives_partner_id_fkey"
		}),
	check("partner_incentives_status_check", sql`status = ANY (ARRAY['ELIGIBLE'::text, 'INELIGIBLE'::text, 'CLAIMED'::text])`),
]);

export const faqKb = pgTable("faq_kb", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	category: text().notNull(),
	question: text().notNull(),
	answer: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	check("faq_kb_category_check", sql`category = ANY (ARRAY['ORDER_PROCESS'::text, 'PICKUP'::text, 'DELIVERY'::text, 'PAYMENTS'::text, 'WALLET'::text, 'APP_USAGE'::text, 'SAFETY'::text, 'TROUBLESHOOTING'::text])`),
]);

export const partnerLeaderboard = pgTable("partner_leaderboard", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	partnerId: uuid("partner_id").notNull(),
	scope: text().notNull(),
	rank: integer().notNull(),
	score: integer().notNull(),
	completedDeliveries: integer("completed_deliveries").default(0),
	rating: numeric({ mode: 'number' }).default(5.00),
	asOfDate: date("as_of_date").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "partner_leaderboard_partner_id_fkey"
		}),
	check("partner_leaderboard_scope_check", sql`scope = ANY (ARRAY['SOCIETY'::text, 'CITY'::text, 'REGION'::text, 'COMPANY'::text])`),
]);

export const partnerRedemptions = pgTable("partner_redemptions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	partnerId: uuid("partner_id").notNull(),
	rewardCatalogId: uuid("reward_catalog_id"),
	code: text().notNull(),
	status: text().default('ISSUED'),
	redeemedAt: timestamp("redeemed_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "partner_redemptions_partner_id_fkey"
		}),
	foreignKey({
			columns: [table.rewardCatalogId],
			foreignColumns: [rewardCatalog.id],
			name: "partner_redemptions_reward_catalog_id_fkey"
		}),
	check("partner_redemptions_status_check", sql`status = ANY (ARRAY['ISSUED'::text, 'REDEEMED'::text, 'EXPIRED'::text])`),
]);

export const partnerSettings = pgTable("partner_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	partnerId: uuid("partner_id").notNull(),
	language: text().default('en'),
	theme: text().default('light'),
	notificationsEnabled: boolean("notifications_enabled").default(true),
	biometricsEnabled: boolean("biometrics_enabled").default(false),
	locationPreferences: text("location_preferences").default('ALWAYS'),
	mapPreferences: text("map_preferences").default('GOOGLE'),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "partner_settings_partner_id_fkey"
		}),
	unique("partner_settings_partner_id_key").on(table.partnerId),
	check("partner_settings_language_check", sql`language = ANY (ARRAY['en'::text, 'hi'::text, 'kn'::text, 'ta'::text])`),
	check("partner_settings_theme_check", sql`theme = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text])`),
	check("partner_settings_location_preferences_check", sql`location_preferences = ANY (ARRAY['ALWAYS'::text, 'WHILE_USING'::text, 'DISABLED'::text])`),
	check("partner_settings_map_preferences_check", sql`map_preferences = ANY (ARRAY['GOOGLE'::text, 'APPLE'::text, 'OSM'::text])`),
]);

export const verificationRequests = pgTable("verification_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	partnerId: uuid("partner_id").notNull(),
	status: text().default('PENDING').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "verification_requests_partner_id_fkey"
		}),
	check("verification_requests_status_check", sql`status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text])`),
]);

export const systemAuditLogs = pgTable("system_audit_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	partnerId: uuid("partner_id"),
	eventType: text("event_type").notNull(),
	severity: text().default('INFO'),
	description: text().notNull(),
	apiLatency: numeric("api_latency", { mode: 'number' }),
	batteryLevel: integer("battery_level"),
	gpsStatus: text("gps_status"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "system_audit_logs_partner_id_fkey"
		}),
	check("system_audit_logs_severity_check", sql`severity = ANY (ARRAY['INFO'::text, 'WARNING'::text, 'ERROR'::text, 'CRITICAL'::text])`),
]);

export const complianceDocs = pgTable("compliance_docs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	documentType: text("document_type").notNull(),
	title: text().notNull(),
	content: text().notNull(),
	version: text().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("compliance_docs_document_type_key").on(table.documentType),
	check("compliance_docs_document_type_check", sql`document_type = ANY (ARRAY['PRIVACY_POLICY'::text, 'TERMS_OF_SERVICE'::text, 'PARTNER_AGREEMENT'::text, 'LICENSES'::text])`),
]);

export const deviceTokens = pgTable("device_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "device_tokens_profile_id_fkey"
		}),
	unique("device_tokens_token_key").on(table.token),
]);

export const notificationPreferences = pgTable("notification_preferences", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	pushEnabled: boolean("push_enabled").default(true).notNull(),
	inAppEnabled: boolean("in_app_enabled").default(true).notNull(),
	promotionalEnabled: boolean("promotional_enabled").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "notification_preferences_profile_id_fkey"
		}),
	unique("notification_preferences_profile_id_key").on(table.profileId),
]);

export const verificationHistory = pgTable("verification_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	requestId: uuid("request_id"),
	status: text().notNull(),
	notes: text(),
	performedBy: uuid("performed_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.requestId],
			foreignColumns: [verificationRequests.id],
			name: "verification_history_request_id_fkey"
		}),
	foreignKey({
			columns: [table.performedBy],
			foreignColumns: [profiles.id],
			name: "verification_history_performed_by_fkey"
		}),
]);

export const deliveryPartnerLocation = pgTable("delivery_partner_location", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	partnerId: uuid("partner_id").notNull(),
	orderId: uuid("order_id"),
	latitude: numeric({ mode: 'number' }).notNull(),
	longitude: numeric({ mode: 'number' }).notNull(),
	accuracy: numeric({ mode: 'number' }),
	heading: numeric({ mode: 'number' }),
	speed: numeric({ mode: 'number' }),
	batteryLevel: integer("battery_level"),
	gpsProvider: text("gps_provider"),
	capturedAt: timestamp("captured_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "delivery_partner_location_partner_id_fkey"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "delivery_partner_location_order_id_fkey"
		}),
]);

export const partnerFeedback = pgTable("partner_feedback", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	partnerId: uuid("partner_id").notNull(),
	feedbackType: text("feedback_type").notNull(),
	description: text().notNull(),
	status: text().default('PENDING'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "partner_feedback_partner_id_fkey"
		}),
	check("partner_feedback_feedback_type_check", sql`feedback_type = ANY (ARRAY['APP_FEEDBACK'::text, 'BUG_REPORT'::text, 'FEATURE_REQUEST'::text, 'GENERAL_SUGGESTION'::text])`),
	check("partner_feedback_status_check", sql`status = ANY (ARRAY['PENDING'::text, 'UNDER_REVIEW'::text, 'RESOLVED'::text])`),
]);

export const partnerDevices = pgTable("partner_devices", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	partnerId: uuid("partner_id").notNull(),
	deviceName: text("device_name").notNull(),
	osType: text("os_type").notNull(),
	appVersion: text("app_version").notNull(),
	deviceToken: text("device_token"),
	lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	lastSyncAt: timestamp("last_sync_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "partner_devices_partner_id_fkey"
		}),
]);

export const kitchenVerifications = pgTable("kitchen_verifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	kitchenId: uuid("kitchen_id").notNull(),
	status: text().default('PENDING').notNull(),
	documentsUrl: text("documents_url").array(),
	hygieneRecordsUrl: text("hygiene_records_url").array(),
	verifierId: uuid("verifier_id"),
	verificationNotes: text("verification_notes"),
	verificationDate: timestamp("verification_date", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.kitchenId],
			foreignColumns: [kitchens.id],
			name: "kitchen_verifications_kitchen_id_fkey"
		}),
	foreignKey({
			columns: [table.verifierId],
			foreignColumns: [profiles.id],
			name: "kitchen_verifications_verifier_id_fkey"
		}),
	check("kitchen_verifications_status_check", sql`status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text, 'REQUEST_RESUBMISSION'::text, 'SUSPENDED'::text])`),
]);

export const orders = pgTable("orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderCode: text("order_code"),
	customerId: uuid("customer_id"),
	kitchenId: uuid("kitchen_id"),
	status: text().default('PLACED'),
	deliveryMethod: text("delivery_method").default('DELIVERY_PARTNER'),
	deliveryFee: numeric("delivery_fee", { mode: 'number' }).default(0),
	listPrice: numeric("list_price", { mode: 'number' }).default(0),
	discount: numeric({ mode: 'number' }).default(0),
	totalPaid: numeric("total_paid", { mode: 'number' }).default(0),
	deliveryAddress: text("delivery_address"),
	allergyTags: text("allergy_tags").array().default([]),
	allergyOtherText: text("allergy_other_text"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	deliveryPartnerId: uuid("delivery_partner_id"),
	itemTotal: numeric("item_total", { mode: 'number' }).default(0),
	discountAmount: numeric("discount_amount", { mode: 'number' }).default(0),
	taxes: numeric({ mode: 'number' }).default(0),
	grandTotal: numeric("grand_total", { mode: 'number' }).default(0),
	platformCommission: numeric("platform_commission", { mode: 'number' }).default(0),
	netChefEarnings: numeric("net_chef_earnings", { mode: 'number' }).default(0),
	taxAmount: numeric("tax_amount", { mode: 'number' }).default(0),
	paymentStatus: text("payment_status").default('pending'),
	razorpayOrderId: text("razorpay_order_id"),
	razorpayPaymentId: text("razorpay_payment_id"),
	isPartyOrder: boolean("is_party_order").default(false).notNull(),
	guestCount: integer("guest_count"),
	perHeadPrice: numeric("per_head_price", { mode: 'number' }).default(0),
	partyBookingDate: timestamp("party_booking_date", { withTimezone: true, mode: 'string' }),
	selectedPackName: text("selected_pack_name"),
	partyDishes: jsonb("party_dishes").default([]),
	// Hand-added, not introspected — see supabase/local/025_payments_webhooks_table.sql
	cfOrderId: text("cf_order_id"),
	paymentSessionId: text("payment_session_id"),
	paymentGateway: text("payment_gateway"),
	cfPaymentId: text("cf_payment_id"),
	acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_orders_is_party_order").using("btree", table.isPartyOrder.asc().nullsLast().op("bool_ops")).where(sql`(is_party_order = true)`),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [profiles.id],
			name: "orders_customer_id_fkey"
		}),
	foreignKey({
			columns: [table.kitchenId],
			foreignColumns: [kitchens.id],
			name: "orders_kitchen_id_fkey"
		}),
	foreignKey({
			columns: [table.deliveryPartnerId],
			foreignColumns: [deliveryPartners.id],
			name: "fk_orders_delivery_partner"
		}),
	unique("orders_order_code_key").on(table.orderCode),
]);

export const kitchens = pgTable("kitchens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chefUserId: uuid("chef_user_id"),
	name: text().notNull(),
	address: text(),
	bio: text(),
	specialty: text(),
	isVerified: boolean("is_verified").default(false),
	isTopRated: boolean("is_top_rated").default(false),
	profileImageUrl: text("profile_image_url"),
	galleryUrls: text("gallery_urls").array().default([]),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	coverImage: text("cover_image"),
	profileImage: text("profile_image"),
	gallery: text().array().default([]),
	videos: text().array().default([]),
	kitchenInfo: jsonb("kitchen_info").default({}),
	storyPrompts: jsonb("story_prompts").default([]),
	hygieneDetails: jsonb("hygiene_details").default([]),
	trustBadges: jsonb("trust_badges").default([]),
	stats: jsonb().default({}),
	chefName: text("chef_name"),
	societyId: uuid("society_id"),
	tower: text(),
	flat: text(),
	hideIdentity: boolean("hide_identity").default(false),
	defaultLeadTimeMinutes: integer("default_lead_time_minutes").default(120),
	bankStatus: text("bank_status").default('pending'),
	hygieneStatus: text("hygiene_status").default('pending'),
	isLive: boolean("is_live").default(false),
}, (table) => [
	foreignKey({
			columns: [table.chefUserId],
			foreignColumns: [profiles.id],
			name: "kitchens_chef_user_id_fkey"
		}),
]);

export const partnerDocuments = pgTable("partner_documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	partnerId: uuid("partner_id").notNull(),
	documentType: text("document_type").notNull(),
	documentUrl: text("document_url").notNull(),
	status: text().default('PENDING').notNull(),
	expiryDate: date("expiry_date"),
	rejectionReason: text("rejection_reason"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "partner_documents_partner_id_fkey"
		}),
	check("partner_documents_document_type_check", sql`document_type = ANY (ARRAY['aadhaar_front'::text, 'aadhaar_back'::text, 'pan_card'::text, 'license_front'::text, 'license_back'::text, 'passport'::text, 'selfie'::text])`),
	check("partner_documents_status_check", sql`status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text])`),
]);

export const auditLogs = pgTable("audit_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	actorId: uuid("actor_id"),
	actorRole: text("actor_role"),
	action: text().notNull(),
	module: text().notNull(),
	entityType: text("entity_type"),
	entityId: uuid("entity_id"),
	previousData: jsonb("previous_data"),
	newData: jsonb("new_data"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.actorId],
			foreignColumns: [profiles.id],
			name: "audit_logs_actor_id_fkey"
		}),
]);

export const deliveryAssignments = pgTable("delivery_assignments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	partnerId: uuid("partner_id").notNull(),
	status: text().default('ASSIGNED').notNull(),
	pickupOtp: text("pickup_otp").notNull(),
	deliveryOtp: text("delivery_otp").notNull(),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: 'string' }),
	pickedUpAt: timestamp("picked_up_at", { withTimezone: true, mode: 'string' }),
	deliveredAt: timestamp("delivered_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "delivery_assignments_order_id_fkey"
		}),
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "delivery_assignments_partner_id_fkey"
		}),
	check("delivery_assignments_status_check", sql`status = ANY (ARRAY['ASSIGNED'::text, 'ACCEPTED'::text, 'REJECTED'::text, 'AT_PICKUP'::text, 'PICKED_UP'::text, 'OUT_FOR_DELIVERY'::text, 'REACHED_CUSTOMER'::text, 'DELIVERED'::text, 'CANCELLED'::text, 'FAILED'::text])`),
]);

export const deliveryTracking = pgTable("delivery_tracking", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	assignmentId: uuid("assignment_id").notNull(),
	lat: numeric({ mode: 'number' }).notNull(),
	lng: numeric({ mode: 'number' }).notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.assignmentId],
			foreignColumns: [deliveryAssignments.id],
			name: "delivery_tracking_assignment_id_fkey"
		}),
]);

export const deliveryEarnings = pgTable("delivery_earnings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	assignmentId: uuid("assignment_id").notNull(),
	partnerId: uuid("partner_id").notNull(),
	amount: numeric({ mode: 'number' }).notNull(),
	status: text().default('PENDING').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.assignmentId],
			foreignColumns: [deliveryAssignments.id],
			name: "delivery_earnings_assignment_id_fkey"
		}),
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [deliveryPartners.id],
			name: "delivery_earnings_partner_id_fkey"
		}),
	check("delivery_earnings_status_check", sql`status = ANY (ARRAY['PENDING'::text, 'PAID'::text])`),
]);

export const payoutRequests = pgTable("payout_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	kitchenId: uuid("kitchen_id").notNull(),
	amount: numeric({ mode: 'number' }).notNull(),
	bankDetails: jsonb("bank_details").notNull(),
	status: text().default('PENDING').notNull(),
	referenceId: text("reference_id"),
	requestedAt: timestamp("requested_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	processedAt: timestamp("processed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_payout_requests_kitchen_id").using("btree", table.kitchenId.asc().nullsLast().op("uuid_ops")),
	index("idx_payout_requests_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.kitchenId],
			foreignColumns: [kitchens.id],
			name: "payout_requests_kitchen_id_fkey"
		}).onDelete("cascade"),
	check("payout_requests_amount_check", sql`amount > (0)::numeric`),
	check("payout_requests_status_check", sql`status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'PROCESSING'::text, 'COMPLETED'::text, 'FAILED'::text, 'REJECTED'::text])`),
]);

export const partyMenus = pgTable("party_menus", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	kitchenId: uuid("kitchen_id").notNull(),
	isEnabled: boolean("is_enabled").default(false).notNull(),
	minGuests: integer("min_guests").default(10).notNull(),
	advanceNoticeHours: integer("advance_notice_hours").default(24).notNull(),
	packages: jsonb().default([]).notNull(),
	dishes: jsonb().default([]).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.kitchenId],
			foreignColumns: [kitchens.id],
			name: "party_menus_kitchen_id_fkey"
		}).onDelete("cascade"),
	unique("party_menus_kitchen_id_key").on(table.kitchenId),
]);

// Hand-added, not introspected: these two tables didn't exist in the live
// database (confirmed against the live schema dump) even though
// wallet.repository.ts and types/wallet.ts's LedgerEntry already expected
// them. See supabase/local/003_financial_core_tables.sql.
export const financialLedger = pgTable("financial_ledger", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	debitWalletId: uuid("debit_wallet_id"),
	creditWalletId: uuid("credit_wallet_id"),
	amount: numeric({ mode: 'number' }).notNull(),
	currency: text().default('INR').notNull(),
	transactionReference: text("transaction_reference"),
	description: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.debitWalletId],
			foreignColumns: [wallets.id],
			name: "financial_ledger_debit_wallet_id_fkey"
		}),
	foreignKey({
			columns: [table.creditWalletId],
			foreignColumns: [wallets.id],
			name: "financial_ledger_credit_wallet_id_fkey"
		}),
	check("financial_ledger_amount_check", sql`amount > (0)::numeric`),
]);

export const financialAuditLogs = pgTable("financial_audit_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	walletId: uuid("wallet_id"),
	action: text().notNull(),
	oldBalance: numeric("old_balance", { mode: 'number' }).notNull(),
	newBalance: numeric("new_balance", { mode: 'number' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.walletId],
			foreignColumns: [wallets.id],
			name: "financial_audit_logs_wallet_id_fkey"
		}),
]);

// Hand-added, not introspected: confirmed absent from the live database even
// though crm.controller.ts/crm.service.ts already call it live. See
// supabase/local/004_admin_notes_table.sql.
export const adminNotes = pgTable("admin_notes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entityType: text("entity_type").notNull(),
	entityId: text("entity_id").notNull(),
	authorId: uuid("author_id"),
	note: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [profiles.id],
			name: "admin_notes_author_id_fkey"
		}),
	check("admin_notes_entity_type_check", sql`entity_type = ANY (ARRAY['CUSTOMER'::text, 'CHEF'::text, 'ORDER'::text, 'PARTNER'::text])`),
]);

// Hand-added, not introspected — see supabase/local/007_knowledge_base_articles_table.sql
export const knowledgeBaseArticles = pgTable("knowledge_base_articles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	content: text().notNull(),
	category: text().notNull(),
	tags: text().array().default([]).notNull(),
	status: text().default('DRAFT').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	check("knowledge_base_articles_status_check", sql`status = ANY (ARRAY['DRAFT'::text, 'PUBLISHED'::text, 'ARCHIVED'::text])`),
]);

// Hand-added, not introspected — see supabase/local/008_ai_feature_tables.sql
export const aiTicketAnalysis = pgTable("ai_ticket_analysis", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ticketId: uuid("ticket_id").notNull(),
	suggestedPriority: text("suggested_priority").notNull(),
	suggestedCategory: text("suggested_category").notNull(),
	suggestedReply: text("suggested_reply").notNull(),
	sentiment: text().notNull(),
	isApplied: boolean("is_applied").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ticketId],
			foreignColumns: [tickets.id],
			name: "ai_ticket_analysis_ticket_id_fkey"
		}).onDelete("cascade"),
]);

export const aiMessages = pgTable("ai_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: text("session_id").notNull(),
	role: text().notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_ai_messages_session_id").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
]);

export const aiUsageLogs = pgTable("ai_usage_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	provider: text().notNull(),
	action: text().notNull(),
	promptTokens: integer("prompt_tokens").default(0).notNull(),
	completionTokens: integer("completion_tokens").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

// Hand-added, not introspected — see supabase/local/009_reward_points_tables.sql
export const rewardPoints = pgTable("reward_points", {
	profileId: uuid("profile_id").primaryKey().notNull(),
	pointsBalance: integer("points_balance").default(0).notNull(),
	level: text().default('Bronze').notNull(),
	totalEarned: integer("total_earned").default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "reward_points_profile_id_fkey"
		}).onDelete("cascade"),
	check("reward_points_level_check", sql`level = ANY (ARRAY['Bronze'::text, 'Silver'::text, 'Gold'::text, 'Platinum'::text])`),
]);

export const pointTransactions = pgTable("point_transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	amount: integer().notNull(),
	type: text().notNull(),
	sourceId: text("source_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "point_transactions_profile_id_fkey"
		}).onDelete("cascade"),
	check("point_transactions_type_check", sql`type = ANY (ARRAY['EARN'::text, 'REDEEM'::text, 'EXPIRE'::text])`),
]);

export const referrals = pgTable("referrals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	referrerId: uuid("referrer_id").notNull(),
	referredId: uuid("referred_id").notNull(),
	status: text().default('PENDING').notNull(),
	rewardAmount: integer("reward_amount").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.referrerId],
			foreignColumns: [profiles.id],
			name: "referrals_referrer_id_fkey"
		}),
	foreignKey({
			columns: [table.referredId],
			foreignColumns: [profiles.id],
			name: "referrals_referred_id_fkey"
		}),
	check("referrals_status_check", sql`status = ANY (ARRAY['PENDING'::text, 'COMPLETED'::text])`),
]);

// Hand-added, not introspected — see supabase/local/010_campaigns_table.sql
export const campaigns = pgTable("campaigns", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	type: text().notNull(),
	targetAudience: text("target_audience").notNull(),
	targetId: uuid("target_id"),
	content: text().notNull(),
	startDate: timestamp("start_date", { withTimezone: true, mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { withTimezone: true, mode: 'string' }),
	isActive: boolean("is_active").default(true).notNull(),
	metricsSent: integer("metrics_sent").default(0).notNull(),
	metricsOpened: integer("metrics_opened").default(0).notNull(),
	metricsConverted: integer("metrics_converted").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	check("campaigns_type_check", sql`type = ANY (ARRAY['PUSH'::text, 'BANNER'::text, 'COUPON'::text, 'REFERRAL'::text])`),
	check("campaigns_target_audience_check", sql`target_audience = ANY (ARRAY['ALL'::text, 'SOCIETY'::text, 'INACTIVE'::text, 'VIP'::text, 'CHEFS'::text, 'NEW_USERS'::text])`),
]);

// Hand-added, not introspected — see supabase/local/011_accounting_tables.sql
export const accountingJournals = pgTable("accounting_journals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	transactionDate: timestamp("transaction_date", { withTimezone: true, mode: 'string' }).notNull(),
	description: text().notNull(),
	referenceType: text("reference_type").notNull(),
	referenceId: text("reference_id").notNull(),
	totalAmount: numeric("total_amount", { mode: 'number' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const accountingLedgerLines = pgTable("accounting_ledger_lines", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	journalId: uuid("journal_id").notNull(),
	accountId: text("account_id").notNull(),
	isCredit: boolean("is_credit").notNull(),
	amount: numeric({ mode: 'number' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.journalId],
			foreignColumns: [accountingJournals.id],
			name: "accounting_ledger_lines_journal_id_fkey"
		}).onDelete("cascade"),
]);

export const taxRecords = pgTable("tax_records", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id"),
	taxType: text("tax_type").notNull(),
	taxRate: numeric("tax_rate", { mode: 'number' }).notNull(),
	taxAmount: numeric("tax_amount", { mode: 'number' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "tax_records_order_id_fkey"
		}),
]);

// Hand-added, not introspected — see supabase/local/012_complaints_table.sql
export const complaints = pgTable("complaints", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	reporterId: uuid("reporter_id").notNull(),
	targetId: text("target_id"),
	type: text().notNull(),
	description: text().notNull(),
	status: text().default('OPEN').notNull(),
	assignedTo: uuid("assigned_to"),
	resolutionNotes: text("resolution_notes"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.reporterId],
			foreignColumns: [profiles.id],
			name: "complaints_reporter_id_fkey"
		}),
	foreignKey({
			columns: [table.assignedTo],
			foreignColumns: [profiles.id],
			name: "complaints_assigned_to_fkey"
		}),
	check("complaints_type_check", sql`type = ANY (ARRAY['FOOD_QUALITY'::text, 'LATE_DELIVERY'::text, 'MISSING_ITEM'::text, 'PAYMENT_ISSUE'::text, 'REFUND_ISSUE'::text, 'KITCHEN_HYGIENE'::text, 'CHEF_BEHAVIOUR'::text, 'CUSTOMER_BEHAVIOUR'::text, 'TECHNICAL_ISSUE'::text])`),
	check("complaints_status_check", sql`status = ANY (ARRAY['OPEN'::text, 'IN_PROGRESS'::text, 'RESOLVED'::text, 'CLOSED'::text, 'ESCALATED'::text])`),
]);

// Hand-added, not introspected — see supabase/local/013_invoices_table.sql
export const invoices = pgTable("invoices", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	invoiceNumber: text("invoice_number").notNull(),
	referenceId: text("reference_id").notNull(),
	type: text().notNull(),
	issuedTo: uuid("issued_to").notNull(),
	subtotal: numeric({ mode: 'number' }).notNull(),
	taxTotal: numeric("tax_total", { mode: 'number' }).default(0).notNull(),
	discountTotal: numeric("discount_total", { mode: 'number' }).default(0).notNull(),
	grandTotal: numeric("grand_total", { mode: 'number' }).notNull(),
	status: text().default('ISSUED').notNull(),
	issuedAt: timestamp("issued_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	downloadUrl: text("download_url"),
}, (table) => [
	unique("invoices_invoice_number_key").on(table.invoiceNumber),
	foreignKey({
			columns: [table.issuedTo],
			foreignColumns: [profiles.id],
			name: "invoices_issued_to_fkey"
		}),
	check("invoices_type_check", sql`type = ANY (ARRAY['CONSUMER_ORDER'::text, 'CHEF_SETTLEMENT'::text, 'CREDIT_NOTE'::text, 'DEBIT_NOTE'::text])`),
	check("invoices_status_check", sql`status = ANY (ARRAY['DRAFT'::text, 'ISSUED'::text, 'PAID'::text, 'CANCELLED'::text])`),
]);

// Hand-added, not introspected — see supabase/local/014_recommendation_tables.sql
export const recommendationPreferences = pgTable("recommendation_preferences", {
	id: uuid().primaryKey().notNull(),
	favoriteCuisines: text("favorite_cuisines").array().default([]).notNull(),
	dietaryPreferences: text("dietary_preferences").array().default([]).notNull(),
	pricePreference: text("price_preference").default('MEDIUM').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [profiles.id],
			name: "recommendation_preferences_id_fkey"
		}).onDelete("cascade"),
	check("recommendation_preferences_price_preference_check", sql`price_preference = ANY (ARRAY['LOW'::text, 'MEDIUM'::text, 'HIGH'::text])`),
]);

export const recommendationFeedback = pgTable("recommendation_feedback", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	itemId: text("item_id").notNull(),
	itemType: text("item_type").notNull(),
	action: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "recommendation_feedback_profile_id_fkey"
		}).onDelete("cascade"),
	check("recommendation_feedback_item_type_check", sql`item_type = ANY (ARRAY['DISH'::text, 'KITCHEN'::text, 'CHEF'::text, 'COUPON'::text])`),
	check("recommendation_feedback_action_check", sql`action = ANY (ARRAY['LIKE'::text, 'DISLIKE'::text, 'NOT_INTERESTED'::text])`),
]);

// Hand-added, not introspected — see supabase/local/015_fraud_tables.sql
export const fraudRules = pgTable("fraud_rules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	priority: integer().default(0).notNull(),
	conditions: jsonb().default({}).notNull(),
	actions: text().array().default([]).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const trustScores = pgTable("trust_scores", {
	id: uuid().primaryKey().notNull(),
	score: integer().default(100).notNull(),
	factors: jsonb().default({}).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [profiles.id],
			name: "trust_scores_id_fkey"
		}).onDelete("cascade"),
]);

export const fraudCases = pgTable("fraud_cases", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	targetId: text("target_id").notNull(),
	targetType: text("target_type").notNull(),
	status: text().default('OPEN').notNull(),
	triggeredRules: text("triggered_rules").array().default([]).notNull(),
	aiSummary: text("ai_summary"),
	resolutionNotes: text("resolution_notes"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	check("fraud_cases_target_type_check", sql`target_type = ANY (ARRAY['USER'::text, 'ORDER'::text, 'PAYMENT'::text])`),
	check("fraud_cases_status_check", sql`status = ANY (ARRAY['OPEN'::text, 'IN_REVIEW'::text, 'RESOLVED'::text, 'FALSE_POSITIVE'::text])`),
]);

export const fraudActivityLogs = pgTable("fraud_activity_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	actorId: uuid("actor_id"),
	action: text().notNull(),
	details: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.actorId],
			foreignColumns: [profiles.id],
			name: "fraud_activity_logs_actor_id_fkey"
		}),
]);

// Hand-added, not introspected — see supabase/local/016_rbac_tables.sql
export const roles = pgTable("roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text().default('').notNull(),
	isSystemRole: boolean("is_system_role").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("roles_name_key").on(table.name),
]);

export const permissions = pgTable("permissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	module: text().notNull(),
	action: text().notNull(),
	description: text().default('').notNull(),
});

export const rolePermissions = pgTable("role_permissions", {
	roleId: uuid("role_id").notNull(),
	permissionId: uuid("permission_id").notNull(),
}, (table) => [
	primaryKey({ columns: [table.roleId, table.permissionId] }),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "role_permissions_role_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [permissions.id],
			name: "role_permissions_permission_id_fkey"
		}).onDelete("cascade"),
]);

export const userRoles = pgTable("user_roles", {
	profileId: uuid("profile_id").notNull(),
	roleId: uuid("role_id").notNull(),
}, (table) => [
	primaryKey({ columns: [table.profileId, table.roleId] }),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "user_roles_profile_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "user_roles_role_id_fkey"
		}).onDelete("cascade"),
]);

// Hand-added, not introspected — see supabase/local/017_commission_rules_table.sql
export const commissionRules = pgTable("commission_rules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	kitchenId: uuid("kitchen_id"),
	societyId: uuid("society_id"),
	category: text(),
	percentage: numeric({ mode: 'number' }).notNull(),
	fixedFee: numeric("fixed_fee", { mode: 'number' }).default(0).notNull(),
	active: boolean().default(true).notNull(),
	effectiveDate: timestamp("effective_date", { withTimezone: true, mode: 'string' }),
	expiryDate: timestamp("expiry_date", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.kitchenId],
			foreignColumns: [kitchens.id],
			name: "commission_rules_kitchen_id_fkey"
		}),
	foreignKey({
			columns: [table.societyId],
			foreignColumns: [societies.id],
			name: "commission_rules_society_id_fkey"
		}),
]);

// Hand-added, not introspected — see supabase/local/018_platform_settings_table.sql
export const platformSettings = pgTable("platform_settings", {
	key: text().primaryKey().notNull(),
	value: jsonb().notNull(),
	description: text().default('').notNull(),
	category: text().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by"),
}, (table) => [
	check("platform_settings_category_check", sql`category = ANY (ARRAY['FINANCE'::text, 'SYSTEM'::text, 'OPERATIONS'::text, 'MARKETING'::text])`),
]);

// Hand-added, not introspected — see supabase/local/019_marketing_tables.sql
export const marketingPreferences = pgTable("marketing_preferences", {
	id: uuid().primaryKey().notNull(),
	emailOptIn: boolean("email_opt_in").default(true).notNull(),
	smsOptIn: boolean("sms_opt_in").default(true).notNull(),
	pushOptIn: boolean("push_opt_in").default(true).notNull(),
	promotionsOptIn: boolean("promotions_opt_in").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [profiles.id],
			name: "marketing_preferences_id_fkey"
		}).onDelete("cascade"),
]);

export const marketingCampaigns = pgTable("marketing_campaigns", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	targetSegment: text("target_segment"),
	channel: text().notNull(),
	contentTemplate: text("content_template").notNull(),
	status: text().default('DRAFT').notNull(),
	scheduledAt: timestamp("scheduled_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	check("marketing_campaigns_channel_check", sql`channel = ANY (ARRAY['PUSH'::text, 'IN_APP'::text, 'EMAIL'::text, 'SMS'::text])`),
	check("marketing_campaigns_status_check", sql`status = ANY (ARRAY['DRAFT'::text, 'ACTIVE'::text, 'ARCHIVED'::text, 'COMPLETED'::text])`),
]);

export const customerEngagement = pgTable("customer_engagement", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	campaignId: uuid("campaign_id").notNull(),
	status: text().notNull(),
	convertedOrderId: uuid("converted_order_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "customer_engagement_profile_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [marketingCampaigns.id],
			name: "customer_engagement_campaign_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.convertedOrderId],
			foreignColumns: [orders.id],
			name: "customer_engagement_converted_order_id_fkey"
		}),
	check("customer_engagement_status_check", sql`status = ANY (ARRAY['SENT'::text, 'DELIVERED'::text, 'OPENED'::text, 'CONVERTED'::text])`),
]);

// Hand-added, not introspected — see supabase/local/020_inventory_tables.sql
export const ingredients = pgTable("ingredients", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	kitchenId: uuid("kitchen_id").notNull(),
	name: text().notNull(),
	category: text().notNull(),
	unit: text().notNull(),
	costPerUnit: numeric("cost_per_unit", { mode: 'number' }).default(0).notNull(),
	shelfLifeDays: integer("shelf_life_days"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.kitchenId],
			foreignColumns: [kitchens.id],
			name: "ingredients_kitchen_id_fkey"
		}).onDelete("cascade"),
]);

export const kitchenInventory = pgTable("kitchen_inventory", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ingredientId: uuid("ingredient_id").notNull(),
	kitchenId: uuid("kitchen_id").notNull(),
	quantity: numeric({ mode: 'number' }).default(0).notNull(),
	reservedQuantity: numeric("reserved_quantity", { mode: 'number' }).default(0).notNull(),
	minStockLevel: numeric("min_stock_level", { mode: 'number' }).default(0).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ingredientId],
			foreignColumns: [ingredients.id],
			name: "kitchen_inventory_ingredient_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.kitchenId],
			foreignColumns: [kitchens.id],
			name: "kitchen_inventory_kitchen_id_fkey"
		}).onDelete("cascade"),
]);

export const recipeIngredients = pgTable("recipe_ingredients", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dishId: uuid("dish_id").notNull(),
	ingredientId: uuid("ingredient_id").notNull(),
	quantityRequired: numeric("quantity_required", { mode: 'number' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.dishId],
			foreignColumns: [dishes.id],
			name: "recipe_ingredients_dish_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.ingredientId],
			foreignColumns: [ingredients.id],
			name: "recipe_ingredients_ingredient_id_fkey"
		}).onDelete("cascade"),
]);

export const inventoryTransactions = pgTable("inventory_transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	inventoryId: uuid("inventory_id").notNull(),
	type: text().notNull(),
	amount: numeric({ mode: 'number' }).notNull(),
	reason: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.inventoryId],
			foreignColumns: [kitchenInventory.id],
			name: "inventory_transactions_inventory_id_fkey"
		}).onDelete("cascade"),
	check("inventory_transactions_type_check", sql`type = ANY (ARRAY['ADD'::text, 'DEDUCT'::text, 'ADJUST'::text, 'WASTE'::text, 'PURCHASE'::text])`),
]);

export const inventoryWastage = pgTable("inventory_wastage", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	inventoryId: uuid("inventory_id").notNull(),
	quantityLost: numeric("quantity_lost", { mode: 'number' }).notNull(),
	reason: text().notNull(),
	financialLoss: numeric("financial_loss", { mode: 'number' }).default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.inventoryId],
			foreignColumns: [kitchenInventory.id],
			name: "inventory_wastage_inventory_id_fkey"
		}).onDelete("cascade"),
]);

// Hand-added, not introspected — see supabase/local/021_cart_tables.sql
export const carts = pgTable("carts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	kitchenId: uuid("kitchen_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("carts_profile_id_key").on(table.profileId),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "carts_profile_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.kitchenId],
			foreignColumns: [kitchens.id],
			name: "carts_kitchen_id_fkey"
		}),
]);

export const cartItems = pgTable("cart_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cartId: uuid("cart_id").notNull(),
	dishId: uuid("dish_id").notNull(),
	quantity: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.cartId],
			foreignColumns: [carts.id],
			name: "cart_items_cart_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.dishId],
			foreignColumns: [dishes.id],
			name: "cart_items_dish_id_fkey"
		}),
]);

// Hand-added, not introspected — see supabase/local/023_supply_orders.sql
export const supplyOrders = pgTable("supply_orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	kitchenId: uuid("kitchen_id").notNull(),
	status: text().default('PLACED').notNull(),
	totalAmount: numeric("total_amount", { mode: 'number' }).default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.kitchenId],
			foreignColumns: [kitchens.id],
			name: "supply_orders_kitchen_id_fkey"
		}),
]);

export const supplyOrderItems = pgTable("supply_order_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	supplyOrderId: uuid("supply_order_id").notNull(),
	supplyItemId: uuid("supply_item_id"),
	itemNameSnapshot: text("item_name_snapshot").notNull(),
	priceSnapshot: numeric("price_snapshot", { mode: 'number' }).notNull(),
	quantity: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.supplyOrderId],
			foreignColumns: [supplyOrders.id],
			name: "supply_order_items_supply_order_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.supplyItemId],
			foreignColumns: [supplyItems.id],
			name: "supply_order_items_supply_item_id_fkey"
		}),
]);
