// ─────────────────────────────────────────────────────────────────────────────
// Service Gateway — auto-switches between mock and the real backend based on
// EXPO_PUBLIC_FORCE_MOCK (see lib/mockMode.ts). All screens import from here.
// Never import directly from mock/ or supabase/ (the latter talks to the
// Express backend via apiClient despite its name — Supabase itself was fully
// removed from mobile).
// ─────────────────────────────────────────────────────────────────────────────

import { isMockMode } from '../lib/mockMode';
import type { OrderStatus } from '../types';

export { isMockMode };

// Re-export everything from mock as base (always present for tree-shaking)
export * from './mock/index';
export * from './dishMatching';
export * from './dishImageService';

// When real Supabase credentials are detected, override with live implementations.
// Because ESM doesn't allow conditional star-exports, we do named re-exports here.
if (!isMockMode) {
  // This block is intentionally empty — the actual override happens via the
  // dynamic require below, which replaces the module-level exports at runtime.
  // Screens that need guaranteed-live calls can also import directly from
  // services/supabase/index or services/supabase/weeklyDishes.
}

// ── Unified async loader — screens call these and get mock or Supabase ────────
import * as mockService from './mock/index';
import * as supabaseService from './supabase/index';
import { getWeeklyDishesForConsumer as supabaseWeeklyDishes } from './supabase/weeklyDishes';
import { getWeeklyDishesForConsumer as mockWeeklyDishes } from './mock/index';

export const getListings = (...args: Parameters<typeof mockService.getListings>) =>
  isMockMode ? mockService.getListings(...args) : supabaseService.getListings(...args);

export const getKitchen = (...args: Parameters<typeof mockService.getKitchen>) =>
  isMockMode ? mockService.getKitchen(...args) : supabaseService.getKitchen(...args);

export const getDish = (...args: Parameters<typeof mockService.getDish>) =>
  isMockMode ? mockService.getDish(...args) : supabaseService.getDish(...args);

export const getOrders = (...args: Parameters<typeof mockService.getOrders>) =>
  isMockMode ? mockService.getOrders(...args) : supabaseService.getOrders(...args);

export const getOrder = (...args: Parameters<typeof mockService.getOrder>) =>
  isMockMode ? mockService.getOrder(...args) : supabaseService.getOrder(...args);

export const placeOrder = (...args: Parameters<typeof mockService.placeOrder>) =>
  isMockMode ? mockService.placeOrder(...args) : supabaseService.placeOrder(...args);

export const updateOrderStatus = (orderId: string, status: OrderStatus) =>
  isMockMode ? mockService.updateOrderStatus(orderId, status) : supabaseService.updateOrderStatus(orderId, status);

export const addMorePartyPacks = (orderId: string, additionalCount: number, perHeadPrice: number, isAccepted?: boolean) =>
  isMockMode
    ? mockService.addMorePartyPacks(orderId, additionalCount, perHeadPrice, isAccepted)
    : supabaseService.addMorePartyPacks(orderId, additionalCount, perHeadPrice, isAccepted);

export const cancelOrder = (orderId: string) =>
  isMockMode ? mockService.cancelOrder(orderId) : supabaseService.cancelOrder(orderId);

export const getActiveChefProfileId = (...args: Parameters<typeof mockService.getActiveChefProfileId>) =>
  isMockMode ? mockService.getActiveChefProfileId(...args) : supabaseService.getActiveChefProfileId(...args);

export const getChefOrders = (...args: Parameters<typeof mockService.getChefOrders>) =>
  isMockMode ? mockService.getChefOrders(...args) : supabaseService.getChefOrders(...args);

export const getChefDishes = (...args: Parameters<typeof mockService.getChefDishes>) =>
  isMockMode ? mockService.getChefDishes(...args) : supabaseService.getChefDishes(...args);

export const saveChefDishes = (...args: Parameters<typeof mockService.saveChefDishes>) =>
  isMockMode ? mockService.saveChefDishes(...args) : supabaseService.saveChefDishes(...args);

export const deleteChefDish = (...args: Parameters<typeof supabaseService.deleteChefDish>) =>
  isMockMode ? Promise.resolve() : supabaseService.deleteChefDish(...args);

// Chef-authored dish add-ons — no mock-mode backing (nothing to manage
// against in mock mode), matching deleteChefDish's pattern above.
export const getDishAddons = (...args: Parameters<typeof supabaseService.getDishAddons>) =>
  isMockMode ? Promise.resolve([]) : supabaseService.getDishAddons(...args);

export const createDishAddon = (...args: Parameters<typeof supabaseService.createDishAddon>) =>
  isMockMode ? Promise.reject(new Error('Not available in mock mode')) : supabaseService.createDishAddon(...args);

export const updateDishAddon = (...args: Parameters<typeof supabaseService.updateDishAddon>) =>
  isMockMode ? Promise.reject(new Error('Not available in mock mode')) : supabaseService.updateDishAddon(...args);

export const deleteDishAddon = (...args: Parameters<typeof supabaseService.deleteDishAddon>) =>
  isMockMode ? Promise.resolve() : supabaseService.deleteDishAddon(...args);

export const getChefSettlement = (...args: Parameters<typeof mockService.getChefSettlement>) =>
  isMockMode ? mockService.getChefSettlement(...args) : supabaseService.getChefSettlement(...args);

export const updateKitchenProfile = (...args: Parameters<typeof mockService.updateKitchenProfile>) =>
  isMockMode ? mockService.updateKitchenProfile(...args) : supabaseService.updateKitchenProfile(...args);

export const createMockKitchen = (...args: Parameters<typeof mockService.createMockKitchen>) =>
  isMockMode ? mockService.createMockKitchen(...args) : Promise.reject(new Error("createMockKitchen is mock only"));

export const getOrCreateChatThread = (...args: Parameters<typeof supabaseService.getOrCreateChatThread>) =>
  isMockMode ? Promise.resolve({ id: `thread_${args[1]}`, kitchenId: args[1], kitchenName: 'Chef Kitchen' }) : supabaseService.getOrCreateChatThread(...args);

export const sendMessage = (...args: Parameters<typeof mockService.sendMessage>) =>
  isMockMode ? mockService.sendMessage(...args) : supabaseService.sendMessage(...args);

export const getChatThreads = (...args: Parameters<typeof mockService.getChatThreads>) =>
  isMockMode ? mockService.getChatThreads(...args) : supabaseService.getChatThreads(...args);

export const getChatMessages = (...args: Parameters<typeof mockService.getChatMessages>) =>
  isMockMode ? mockService.getChatMessages(...args) : supabaseService.getChatMessages(...args);

export const getSupplies = (...args: Parameters<typeof mockService.getSupplies>) =>
  isMockMode ? mockService.getSupplies(...args) : supabaseService.getSupplies(...args);

export const placeSupplyOrder = (items: { supply_item_id: string; quantity: number }[]) =>
  isMockMode ? Promise.resolve() : supabaseService.placeSupplyOrder(items);

export const getWeeklyDishesForConsumer = (...args: Parameters<typeof mockWeeklyDishes>) =>
  isMockMode ? mockWeeklyDishes(...args) : supabaseWeeklyDishes(...args);

import * as supabaseWeekly from './supabase/weeklyDishes';

export const loadWeeklyDishes = (...args: Parameters<typeof mockService.loadWeeklyDishes>) =>
  isMockMode ? mockService.loadWeeklyDishes(...args) : supabaseWeekly.loadWeeklyDishes(...args);

export const saveWeeklyDish = (...args: Parameters<typeof mockService.saveWeeklyDish>) =>
  isMockMode ? mockService.saveWeeklyDish(...args) : supabaseWeekly.saveWeeklyDish(...args);

export const deleteWeeklyDish = (...args: Parameters<typeof mockService.deleteWeeklyDish>) =>
  isMockMode ? mockService.deleteWeeklyDish(...args) : supabaseWeekly.deleteWeeklyDish(...args);

export const updateDishStatus = (id: string, status: any) =>
  isMockMode ? mockService.updateDishStatus(id, status) : supabaseWeekly.updateDishStatus(id, status);

export const subscribeToChat = (...args: Parameters<typeof mockService.subscribeToChat>) =>
  isMockMode ? mockService.subscribeToChat(...args) : supabaseService.subscribeToChat(...args);

export const sendTypingIndicator = (...args: Parameters<typeof mockService.sendTypingIndicator>) =>
  isMockMode ? mockService.sendTypingIndicator(...args) : supabaseService.sendTypingIndicator(...args);

export const markThreadRead = (...args: Parameters<typeof mockService.markThreadRead>) =>
  isMockMode ? mockService.markThreadRead(...args) : supabaseService.markThreadRead(...args);

export const subscribeToOrder = (...args: Parameters<typeof mockService.subscribeToOrder>) =>
  isMockMode ? mockService.subscribeToOrder(...args) : supabaseService.subscribeToOrder(...args);

export const subscribeToChefOrders = (...args: Parameters<typeof mockService.subscribeToChefOrders>) =>
  isMockMode ? mockService.subscribeToChefOrders(...args) : supabaseService.subscribeToChefOrders(...args);

export const subscribeToOpsOrders = (onUpdate: (order?: any) => void) =>
  isMockMode ? mockService.subscribeToOpsOrders(onUpdate) : supabaseService.subscribeToOpsOrders(onUpdate);

export const subscribeToLiveDishes = (onChange: () => void) =>
  isMockMode ? mockService.subscribeToLiveDishes(onChange) : supabaseWeekly.subscribeToLiveDishes(onChange);

export const getReviewsForKitchen = (...args: Parameters<typeof mockService.getReviewsForKitchen>) =>
  isMockMode ? mockService.getReviewsForKitchen(...args) : supabaseService.getReviewsForKitchen(...args);

export const addReview = (...args: Parameters<typeof mockService.addReview>) =>
  isMockMode ? mockService.addReview(...args) : supabaseService.addReview(...args);

export const deleteReview = (...args: Parameters<typeof mockService.deleteReview>) =>
  isMockMode ? mockService.deleteReview(...args) : supabaseService.deleteReview(...args);

import * as mockParty from './mock/partyService';
import * as supabaseParty from './supabase/partyService';

export const getPartyMenu = (...args: Parameters<typeof mockParty.getPartyMenu>) =>
  isMockMode ? mockParty.getPartyMenu(...args) : supabaseParty.getPartyMenu(...args);

export const savePartyMenu = (...args: Parameters<typeof mockParty.savePartyMenu>) =>
  isMockMode ? mockParty.savePartyMenu(...args) : supabaseParty.savePartyMenu(...args);

export const getPartyKitchens = (...args: Parameters<typeof mockParty.getPartyKitchens>) =>
  isMockMode ? mockParty.getPartyKitchens(...args) : supabaseParty.getPartyKitchens(...args);

export const placePartyOrder = (...args: Parameters<typeof mockParty.placePartyOrder>) =>
  isMockMode ? mockParty.placePartyOrder(...args) : supabaseParty.placePartyOrder(...args);

