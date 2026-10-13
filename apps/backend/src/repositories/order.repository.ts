import { and, desc, eq, gte, inArray, lte, notInArray, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { orders, orderItems, settlements, kitchens, profiles } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase } from '../db/caseMapper';
import {
  CreateOrderInput,
  Order,
  OrderItem,
  OrderStatus,
  OrderFilterParams,
  OrderFinancialSummary,
  OrderPaymentStatus,
  OrderSettlementStatus,
} from '../types/order';

/**
 * This whole file assumed columns/tables that don't exist in the real
 * database (confirmed against a live schema dump): orders.profile_id,
 * orders.delivery_mode and orders.platform_fee don't exist (the real columns
 * are customer_id, delivery_method and platform_commission), order_items has
 * no price_at_order (it's price_snapshot), and there is no `payments` table
 * at all — payment info lives directly on orders (payment_status,
 * razorpay_order_id, razorpay_payment_id). Against Supabase this meant every
 * one of these queries would fail outright with "column/relation does not
 * exist" the moment it ran — Drizzle's typed schema makes that unavoidable to
 * notice (it simply has no such fields to reference), so this conversion
 * fixes the column mapping rather than porting broken queries verbatim.
 * `profile_id`/`consumer_id` are kept as response aliases of the real
 * `customer_id` value since downstream code (e.g. requireOrderOwnership)
 * already defensively checks all three.
 */

function orderRowToOrder(row: Record<string, any>): Order {
  const mapped = rowToSnakeCase<any>(row);
  mapped.profile_id = mapped.customer_id;
  mapped.consumer_id = mapped.customer_id;
  return mapped as Order;
}

function orderItemRowToOrderItem(row: Record<string, any>): OrderItem {
  const mapped = rowToSnakeCase<any>(row);
  mapped.price_at_order = mapped.price_snapshot;
  return mapped as OrderItem;
}

const DELIVERY_MODE_TO_METHOD: Record<string, string> = {
  DELIVERY: 'DELIVERY_PARTNER',
  PICKUP: 'SELF_PICKUP',
};

export class OrderRepository {
  static async createOrder(payload: CreateOrderInput): Promise<Order> {
    const rows = await db
      .insert(orders)
      .values({
        customerId: payload.profile_id,
        kitchenId: payload.kitchen_id,
        deliveryMethod: DELIVERY_MODE_TO_METHOD[payload.delivery_mode] || payload.delivery_mode,
        itemTotal: payload.item_total,
        discountAmount: payload.discount_amount,
        deliveryFee: payload.delivery_fee,
        taxes: payload.taxes,
        platformCommission: payload.platform_fee,
        grandTotal: payload.grand_total,
        status: 'PENDING',
      })
      .returning();
    return orderRowToOrder(rows[0]);
  }

  /**
   * "Buy now" single-dish order creation (regular dish or weekly pre-booking),
   * as opposed to createOrder's cart-based checkout. Mirrors exactly what
   * apps/mobile/services/supabase/index.ts#placeOrder used to write directly
   * to Supabase with client-computed totals — see OrderService.createDirectOrder
   * for the server-side pricing that now replaces that.
   */
  static async createDirectOrder(payload: {
    customer_id: string;
    kitchen_id: string;
    delivery_method: string;
    delivery_fee: number;
    list_price: number;
    discount: number;
    total_paid: number;
    delivery_address: string;
    allergy_tags: string[];
    allergy_other_text?: string;
  }): Promise<Order> {
    const orderCode = `HC-${Math.floor(1100 + Math.random() * 700)}`;
    const rows = await db
      .insert(orders)
      .values({
        orderCode,
        customerId: payload.customer_id,
        kitchenId: payload.kitchen_id,
        status: 'PLACED',
        deliveryMethod: payload.delivery_method,
        deliveryFee: payload.delivery_fee,
        listPrice: payload.list_price,
        discount: payload.discount,
        totalPaid: payload.total_paid,
        itemTotal: payload.list_price,
        grandTotal: payload.total_paid,
        deliveryAddress: payload.delivery_address,
        allergyTags: payload.allergy_tags,
        allergyOtherText: payload.allergy_other_text,
      })
      .returning();
    return orderRowToOrder(rows[0]);
  }

  static async createOrderItems(items: Omit<OrderItem, 'id' | 'created_at'>[]): Promise<void> {
    if (items.length === 0) return;
    await db.insert(orderItems).values(
      items.map((item) => ({
        orderId: item.order_id,
        dishId: item.dish_id,
        weeklyDishId: item.weekly_dish_id,
        quantity: item.quantity,
        priceSnapshot: item.price_at_order,
        dishNameSnapshot: item.dish_name_snapshot,
        addons: item.addons ?? [],
      }))
    );
  }

  static async getOrderById(id: string): Promise<Order | null> {
    const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return rows[0] ? orderRowToOrder(rows[0]) : null;
  }

  static async getOrderItems(order_id: string): Promise<OrderItem[]> {
    const rows = await db.select().from(orderItems).where(eq(orderItems.orderId, order_id));
    return rows.map(orderItemRowToOrderItem);
  }

  static async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const rows = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return orderRowToOrder(rows[0]);
  }

  /** Commission/earnings fields computed by settlement.service.ts. */
  static async updateFinancials(id: string, fields: {
    platformCommission?: number;
    netChefEarnings?: number;
    taxAmount?: number;
  }): Promise<Order | null> {
    const rows = await db
      .update(orders)
      .set({ ...fields, updatedAt: new Date().toISOString() })
      .where(eq(orders.id, id))
      .returning();
    return rows[0] ? orderRowToOrder(rows[0]) : null;
  }

  /** Cashfree order/payment-reference fields — see cashfree.service.ts. */
  static async updatePaymentGatewayFields(id: string, fields: {
    status?: OrderStatus;
    // Plain string, not OrderPaymentStatus — the real column's existing
    // values are inconsistently cased ('paid' lowercase is what this file
    // has always written; 'CAPTURED'/'PENDING' elsewhere are uppercase),
    // and this method preserves that exact pre-existing behavior rather
    // than normalizing it.
    paymentStatus?: string;
    cfOrderId?: string;
    paymentSessionId?: string;
    paymentGateway?: string;
    cfPaymentId?: string;
    acceptedAt?: string;
  }): Promise<Order | null> {
    const rows = await db
      .update(orders)
      .set({ ...fields, updatedAt: new Date().toISOString() })
      .where(eq(orders.id, id))
      .returning();
    return rows[0] ? orderRowToOrder(rows[0]) : null;
  }

  static async getConsumerHistory(profile_id: string): Promise<any[]> {
    // The real FK a consumer's orders are keyed on is customer_id (see
    // apps/mobile/services/supabase/index.ts#placeOrder, the live checkout
    // path, which only ever sets customer_id) — this previously filtered on
    // a profile_id column that doesn't exist on orders at all, so this
    // always errored against the real DB rather than returning history.
    //
    // Also joins the kitchen name and each order's line items — the mobile
    // "My Orders" list needs both (apps/mobile/services/supabase/index.ts
    // #mapDbOrder reads kitchen_name/items), and fetching them here in two
    // extra queries total beats either an N+1 per order or the client
    // falling back to generic placeholder text for every single order.
    const rows = await db
      .select({ order: orders, kitchenName: kitchens.name })
      .from(orders)
      .leftJoin(kitchens, eq(orders.kitchenId, kitchens.id))
      .where(eq(orders.customerId, profile_id))
      .orderBy(desc(orders.createdAt));

    const orderIds = rows.map((r) => r.order.id);
    const itemRows = orderIds.length > 0
      ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
      : [];
    const itemsByOrder = new Map<string, OrderItem[]>();
    for (const item of itemRows) {
      const mapped = orderItemRowToOrderItem(item);
      const list = itemsByOrder.get(mapped.order_id) || [];
      list.push(mapped);
      itemsByOrder.set(mapped.order_id, list);
    }

    return rows.map((r) => ({
      ...orderRowToOrder(r.order),
      kitchen_name: r.kitchenName,
      items: itemsByOrder.get(r.order.id) || [],
    }));
  }

  static async getKitchenHistory(kitchen_id: string): Promise<any[]> {
    // Mirrors getConsumerHistory's enrichment above — the chef "Orders" list
    // (apps/mobile/services/supabase/index.ts#getChefOrders, via
    // mapDbChefOrder) needs the customer's name and each order's line items,
    // which a plain `select().from(orders)` doesn't carry. This previously
    // queried Supabase directly for exactly this join (profiles(name,
    // display_name), order_items(*)) instead of using this repository.
    const rows = await db
      .select({ order: orders, customerName: profiles.name, customerDisplayName: profiles.displayName })
      .from(orders)
      .leftJoin(profiles, eq(orders.customerId, profiles.id))
      .where(eq(orders.kitchenId, kitchen_id))
      .orderBy(desc(orders.createdAt));

    const orderIds = rows.map((r) => r.order.id);
    const itemRows = orderIds.length > 0
      ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
      : [];
    const itemsByOrder = new Map<string, OrderItem[]>();
    for (const item of itemRows) {
      const mapped = orderItemRowToOrderItem(item);
      const list = itemsByOrder.get(mapped.order_id) || [];
      list.push(mapped);
      itemsByOrder.set(mapped.order_id, list);
    }

    return rows.map((r) => ({
      ...orderRowToOrder(r.order),
      profiles: { name: r.customerName, display_name: r.customerDisplayName },
      order_items: itemsByOrder.get(r.order.id) || [],
    }));
  }

  static async searchOrdersExtended(params: OrderFilterParams): Promise<any[]> {
    const limit = params.limit || 50;
    const page = params.page || 1;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (params.status && params.status !== 'all') {
      if (params.status === 'ACTIVE') {
        conditions.push(notInArray(orders.status, ['DELIVERED', 'CANCELLED', 'REJECTED']));
      } else {
        conditions.push(eq(orders.status, params.status));
      }
    }
    if (params.payment_status && params.payment_status !== 'all') {
      conditions.push(sql`${orders.paymentStatus} ILIKE ${'%' + params.payment_status.toLowerCase() + '%'}`);
    }
    if (params.startDate) conditions.push(gte(orders.createdAt, params.startDate));
    if (params.endDate) conditions.push(lte(orders.createdAt, params.endDate));

    let data: any[] = [];
    try {
      const rows = await db
        .select()
        .from(orders)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset);
      data = rows.map((row) => orderRowToOrder(row));
    } catch (e) {
      data = [];
    }

    const kitchenIds = data.map((o) => o.kitchen_id).filter(Boolean);
    let settlementRows: any[] = [];
    if (kitchenIds.length > 0) {
      try {
        settlementRows = await db.select().from(settlements).where(inArray(settlements.kitchenId, kitchenIds));
      } catch (e) {}
    }
    const settlementsByKitchen = rowsToSnakeCase<any>(settlementRows);

    const formatted = data.map((order) => {
      const grandTotal = Number(order.grand_total || order.item_total || 0);
      const deliveryFee = Number(order.delivery_fee || 0);
      const taxAmount = Number(order.tax_amount || order.taxes || 0);
      const platformComm = Number(order.platform_commission || grandTotal * 0.1);
      const chefEarn = Number(
        order.net_chef_earnings || Math.max(0, grandTotal - platformComm - deliveryFee - taxAmount)
      );

      // No separate `payments` table exists — payment info lives on the
      // order row itself (payment_status, razorpay_order_id/payment_id).
      const setRecord = settlementsByKitchen.find((s: any) => s.kitchen_id === order.kitchen_id);
      const payMethod = 'UPI';
      const settlementStatus = (setRecord?.status || 'PENDING').toUpperCase();

      return {
        ...order,
        grand_total: grandTotal,
        platform_commission: platformComm,
        tax_amount: taxAmount,
        net_chef_earnings: chefEarn,
        payment_method: payMethod,
        razorpay_payment_id: order.razorpay_payment_id || 'N/A',
        settlement_status: settlementStatus,
        payment_timestamp: order.updated_at || order.created_at,
        profiles: {
          name: order.customer_name || 'Consumer User',
          phone: order.customer_phone || 'N/A',
          email: order.customer_email || 'N/A',
        },
        kitchens: {
          name: order.kitchen_name || 'Home Kitchen',
          chef_name: order.chef_name || 'Chef',
          society_id: order.society_id || 'soc-1',
        },
      };
    });

    let filteredResult = formatted;
    if (params.payment_method && params.payment_method !== 'all') {
      filteredResult = filteredResult.filter(
        (o) => o.payment_method?.toLowerCase() === params.payment_method?.toLowerCase()
      );
    }
    if (params.settlement_status && params.settlement_status !== 'all') {
      filteredResult = filteredResult.filter(
        (o) => o.settlement_status?.toLowerCase() === params.settlement_status?.toLowerCase()
      );
    }
    if (params.query) {
      const q = params.query.toLowerCase();
      filteredResult = filteredResult.filter(
        (o) =>
          o.id?.toLowerCase().includes(q) ||
          o.order_code?.toLowerCase().includes(q) ||
          o.profiles?.name?.toLowerCase().includes(q) ||
          o.kitchens?.name?.toLowerCase().includes(q) ||
          o.kitchens?.chef_name?.toLowerCase().includes(q) ||
          o.razorpay_payment_id?.toLowerCase().includes(q)
      );
    }

    return filteredResult;
  }

  static async getOrderFinancialSummary(order_id: string): Promise<OrderFinancialSummary> {
    const orderRows = await db.select().from(orders).where(eq(orders.id, order_id)).limit(1);
    if (!orderRows[0]) {
      throw new Error(`Order #${order_id} not found`);
    }
    const order = orderRowToOrder(orderRows[0]);

    let setRecord: any = null;
    if (order.kitchen_id) {
      const settlementRows = await db
        .select()
        .from(settlements)
        .where(eq(settlements.kitchenId, order.kitchen_id))
        .limit(1);
      setRecord = settlementRows[0] ? rowToSnakeCase<any>(settlementRows[0]) : null;
    }

    const grandTotal = Number(order.grand_total || (order as any).item_total || 0);
    const discount = Number((order as any).discount_amount || 0);
    const deliveryFee = Number(order.delivery_fee || 0);
    const taxAmount = Number((order as any).tax_amount || (order as any).taxes || 0);
    const platformComm = Number(order.platform_commission || grandTotal * 0.1);
    const gstOnComm = Number((platformComm * 0.18).toFixed(2));
    const netChefEarnings = Number(
      order.net_chef_earnings || Math.max(0, grandTotal - platformComm - deliveryFee - taxAmount)
    );

    // No separate `payments` table — payment status/reference live on the
    // order row itself.
    const paymentStatus: OrderPaymentStatus = (
      order.payment_status?.toUpperCase() === 'PAID' ? 'SUCCESSFUL' : order.payment_status?.toUpperCase() || 'PENDING'
    ) as OrderPaymentStatus;

    const settlementStatus: OrderSettlementStatus = (setRecord?.status?.toUpperCase() || 'PENDING') as OrderSettlementStatus;

    return {
      order_id: order.id,
      payment_info: {
        order_total: grandTotal,
        discount_applied: discount,
        delivery_charges: deliveryFee,
        taxes: taxAmount,
        final_amount_paid: grandTotal,
        payment_method: 'UPI',
        transaction_id: order.razorpay_payment_id || `txn_${order.id.substring(0, 8)}`,
        payment_gateway: 'Razorpay / Platform UPI',
        payment_status: paymentStatus,
        payment_time: order.updated_at || order.created_at,
      },
      commission_breakdown: {
        platform_commission_pct: 10,
        commission_amount: platformComm,
        gst_amount: gstOnComm,
        net_platform_revenue: Number((platformComm + gstOnComm).toFixed(2)),
      },
      chef_earnings: {
        gross_order_amount: grandTotal,
        commission_deduction: platformComm,
        delivery_deduction: deliveryFee,
        net_chef_earnings: netChefEarnings,
      },
      settlement_info: {
        settlement_status: settlementStatus,
        settlement_date: setRecord?.created_at,
        settlement_id: setRecord?.id,
        payout_reference: setRecord?.id ? `payout_${setRecord.id.substring(0, 8)}` : undefined,
        paid_date: settlementStatus === 'PAID' ? setRecord?.created_at : undefined,
      },
    };
  }

  static async updatePaymentStatus(id: string, payment_status: OrderPaymentStatus): Promise<Order> {
    const rows = await db
      .update(orders)
      .set({ paymentStatus: payment_status.toLowerCase(), updatedAt: new Date().toISOString() })
      .where(eq(orders.id, id))
      .returning();
    return orderRowToOrder(rows[0]);
  }

  static async updateSettlementStatus(id: string, settlement_status: OrderSettlementStatus): Promise<any> {
    const orderRows = await db.select({ kitchenId: orders.kitchenId }).from(orders).where(eq(orders.id, id)).limit(1);
    const kitchenId = orderRows[0]?.kitchenId;
    if (kitchenId) {
      await db
        .update(settlements)
        .set({ status: settlement_status })
        .where(eq(settlements.kitchenId, kitchenId));
    }
    return { success: true, order_id: id, settlement_status };
  }
}
