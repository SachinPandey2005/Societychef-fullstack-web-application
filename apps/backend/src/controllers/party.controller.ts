import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors';
import { KitchenRepository } from '../repositories/kitchen.repository';
import { PartyRepository } from '../repositories/party.repository';
import { NotificationService } from '../services/notification.service';

export const getPartyMenu = asyncHandler(async (req: Request, res: Response) => {
  const kitchenId = String(req.params.kitchenId);
  const menu = await PartyRepository.getMenuByKitchenId(kitchenId);
  sendSuccess(res, menu ? 'Party menu retrieved successfully' : 'Default party menu', menu);
});

export const savePartyMenu = asyncHandler(async (req: Request, res: Response) => {
  const kitchenId = req.params.kitchenId as string;
  const { is_enabled, min_guests, advance_notice_hours, packages, dishes } = req.body;

  const user = req.user!;
  const roleUpper = (user.role || '').toUpperCase();
  const isOpsOrAdmin = ['ADMIN', 'OPERATIONS', 'OPS', 'SUPER_ADMIN'].includes(roleUpper);
  if (!isOpsOrAdmin) {
    const kitchen = await KitchenRepository.findById(kitchenId);
    if (!kitchen || kitchen.chef_user_id !== user.id) {
      throw new AuthorizationError('You do not have permission to manage this kitchen\'s party menu.');
    }
  }

  const data = await PartyRepository.upsertMenu(kitchenId, { is_enabled, min_guests, advance_notice_hours, packages, dishes });
  sendSuccess(res, 'Party menu saved successfully', data);
});

export const getPartyKitchens = asyncHandler(async (req: Request, res: Response) => {
  const data = await PartyRepository.getEnabledKitchens();
  sendSuccess(res, 'Party kitchens retrieved successfully', data);
});

/**
 * Self-service party booking — customer_id always comes from the
 * authenticated session, never the request body. Previously mobile
 * (services/supabase/partyService.ts#placePartyOrder) inserted straight into
 * `orders` from the client with the anon/authenticated Supabase key; this is
 * the real backend equivalent.
 *
 * total_amount/per_head_price are NEVER trusted from the client (fixed here
 * — previously they were taken straight from the request body, the same
 * class of forgeable-total hole already closed for regular checkout in
 * cashfree.service.ts). Both are recomputed entirely from the kitchen's own
 * saved party menu: the selected package must be one of the kitchen's real
 * packages, each selected dish's extra charge comes from the kitchen's real
 * dish list (never from whatever the client sends alongside the dish id),
 * and kids pricing uses the same flat default the mobile UI already applies
 * (party_menus has no per-kitchen kids price column yet — same real
 * behavior, just computed server-side instead of trusted from the client).
 */
export const createMyPartyOrder = asyncHandler(async (req: Request, res: Response) => {
  const { kitchen_id, delivery_address, booking_date, guest_count, pack_id, selected_dishes, kids_count } = req.body;

  if (!kitchen_id || !booking_date || !guest_count || !pack_id) {
    throw new ValidationError('kitchen_id, booking_date, guest_count and pack_id are required.');
  }

  const resolvedKitchenId = await PartyRepository.resolveKitchenId(String(kitchen_id));
  if (!resolvedKitchenId) {
    throw new NotFoundError('No matching kitchen found for this party booking.');
  }

  const menu = await PartyRepository.getMenuByKitchenId(resolvedKitchenId);
  if (!menu || !menu.is_enabled) {
    throw new ValidationError('This kitchen does not currently accept party bookings.');
  }

  const guestCount = Number(guest_count);
  if (!Number.isInteger(guestCount) || guestCount <= 0) {
    throw new ValidationError('guest_count must be a positive integer.');
  }
  if (guestCount < Number(menu.min_guests || 1)) {
    throw new ValidationError(`Minimum ${menu.min_guests} guests required for party mode at this kitchen.`);
  }

  const realPackage = (menu.packages || []).find((p: any) => p.id === pack_id);
  if (!realPackage) {
    throw new ValidationError('Selected package is not available for this kitchen.');
  }

  const realDishesById = new Map<string, any>((menu.dishes || []).map((d: any) => [d.id, d]));
  const requestedDishIds: string[] = Array.isArray(selected_dishes)
    ? selected_dishes.map((d: any) => d?.dishId).filter(Boolean)
    : [];
  let extraPerHead = 0;
  const validatedDishes: any[] = [];
  for (const dishId of requestedDishIds) {
    const realDish = realDishesById.get(dishId);
    if (!realDish || realDish.isAvailable === false) continue;
    extraPerHead += Number(realDish.extraChargePerHead || 0);
    validatedDishes.push({
      dishId: realDish.id,
      name: realDish.name,
      category: realDish.category,
      extraChargePerHead: realDish.extraChargePerHead || 0,
    });
  }

  const perHeadPrice = Number(realPackage.pricePerHead || 0) + extraPerHead;
  const kidsCount = Math.max(0, Math.floor(Number(kids_count) || 0));
  const KIDS_PRICE_PER_HEAD = 120; // matches PartyBuilderModal.tsx's default — not yet a configurable per-kitchen field
  const totalAmount = (perHeadPrice * guestCount) + (kidsCount * KIDS_PRICE_PER_HEAD);

  const order = await PartyRepository.createPartyOrder({
    customer_id: req.user!.id,
    kitchen_id: resolvedKitchenId,
    total_amount: totalAmount,
    delivery_address,
    booking_date,
    guest_count: guestCount,
    pack_name: realPackage.name,
    per_head_price: perHeadPrice,
    selected_dishes: validatedDishes,
  });

  try {
    const kitchen = await KitchenRepository.findById(resolvedKitchenId);
    if (kitchen?.chef_user_id) {
      await NotificationService.sendNotification({
        profile_id: kitchen.chef_user_id,
        title: 'New Party Booking!',
        message: `A party booking for ${guestCount} guests (₹${totalAmount}) was just placed.`,
        type: 'CHEF_ALERT',
        entity_type: 'order',
        entity_id: order.id,
      });
    }
    await NotificationService.sendNotification({
      profile_id: req.user!.id,
      title: 'Party Booking Confirmed',
      message: `Your party booking for ${guestCount} guests has been placed.`,
      type: 'ORDER_UPDATE',
      entity_type: 'order',
      entity_id: order.id,
    });

    const { RealtimeService } = require('../services/realtime.service');
    await RealtimeService.broadcastEvent(`chef-orders:${resolvedKitchenId}`, 'NEW_ORDER', order);
    await RealtimeService.broadcastEvent('ops-orders:all', 'NEW_ORDER', order);
  } catch (err) {
    console.error('Failed to send party order creation notifications', err);
  }

  sendSuccess(res, 'Party order placed successfully', order, 201);
});

export const getPartyBookings = asyncHandler(async (req: Request, res: Response) => {
  const data = await PartyRepository.getBookings();
  sendSuccess(res, 'Party bookings retrieved successfully', data);
});

export const getPartyBookingById = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const data = await PartyRepository.getBookingById(id);
  if (!data) throw new NotFoundError('Party booking not found.');
  sendSuccess(res, 'Party booking details retrieved successfully', data);
});

export const updatePartyBookingStatus = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const id = String(req.params.id);
  const { status, reason } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }

  const data = await PartyRepository.updateBookingStatus(id, status);
  if (!data) throw new NotFoundError('Party booking not found.');

  const { CrmService } = require('../services/crm.service');
  await CrmService.logAction(admin_id, `UPDATE_PARTY_BOOKING_${status.toUpperCase()}`, 'order', id, reason || `Status set to ${status}`);

  sendSuccess(res, 'Party booking status updated successfully', data);
});

/**
 * Adds extra guest packs to an existing party pre-booking.
 *
 * This used to be done entirely client-side (apps/mobile's addMorePartyPacks):
 * the mobile app read the order's own total/guest count, computed a new total
 * itself, and wrote it straight to the database with the anon/authenticated
 * client. That meant the price a customer actually pays was whatever number
 * their own client sent — nothing on the server ever recomputed or checked it.
 * This endpoint does the same math, but from the order's own persisted
 * per_head_price (set when the booking was first created), never from
 * anything the client submits.
 */
export const addPartyPacks = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const additionalCount = Number(req.body.additional_count);

  if (!Number.isInteger(additionalCount) || additionalCount <= 0 || additionalCount > 500) {
    throw new ValidationError('additional_count must be a positive integer (max 500).');
  }

  const order = await PartyRepository.getBookingForPacks(id);
  if (!order) throw new NotFoundError('Party booking not found.');

  const currentStatus = String(order.status || '').toUpperCase();
  if (!['PLACED', 'ACCEPTED'].includes(currentStatus)) {
    throw new ValidationError(`This booking is ${currentStatus.toLowerCase()} and can no longer be modified.`);
  }

  const perHeadPrice = Number(order.per_head_price) || 0;
  if (perHeadPrice <= 0) {
    throw new ValidationError('This booking has no per-head price on file — contact support.');
  }

  // 0% edit fee before the chef has accepted; 10% after, same rule the mobile
  // UI already communicates to the customer.
  const isAccepted = currentStatus !== 'PLACED';
  const ratePerPack = isAccepted ? Math.round(perHeadPrice * 1.1) : perHeadPrice;
  const addonTotal = ratePerPack * additionalCount;

  const newGuestCount = Number(order.guest_count || 0) + additionalCount;
  const currentTotal = Number(order.total_paid ?? order.grand_total ?? 0);
  const newTotal = currentTotal + addonTotal;

  const updated = await PartyRepository.applyPackAddon(id, {
    guest_count: newGuestCount,
    total_paid: newTotal,
    grand_total: newTotal,
    ...(isAccepted ? { status: 'PLACED', payment_status: 'pending' } : {}),
  });

  sendSuccess(res, 'Party packs added successfully', {
    additionalCount,
    ratePerPack,
    addonTotal,
    newTotal,
    order: updated,
  });
});
