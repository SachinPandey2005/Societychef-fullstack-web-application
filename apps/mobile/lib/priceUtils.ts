import type { DeliveryMethod } from '../types';

export interface BillSummary {
  listPrice: number;
  discount: number;
  deliveryFee: number;
  totalPayable: number;
}

// Mirrors apps/backend/src/services/order.service.ts#calculateDirectOrderBill
// — the backend recomputes authoritatively and never trusts this, but it
// must match so the preview shown before payment is accurate.
export const FREE_DELIVERY_THRESHOLD = 200;

export function calculateBill(params: {
  dishPrice: number;
  quantity: number;
  sameSociety: boolean;
  deliveryMethod: DeliveryMethod;
}): BillSummary {
  const { dishPrice, quantity, sameSociety, deliveryMethod } = params;
  const listPrice = dishPrice * quantity;
  const discount = sameSociety ? Math.round(listPrice * 0.1) : 0;
  const deliveryFee = deliveryMethod === 'PICKUP' || listPrice >= FREE_DELIVERY_THRESHOLD
    ? 0
    : (sameSociety ? 10 : 35);
  const totalPayable = listPrice - discount + deliveryFee;

  return {
    listPrice,
    discount,
    deliveryFee,
    totalPayable,
  };
}
