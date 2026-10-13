export type CRMEvent =
  | 'ORDER_DISPATCHED'
  | 'ASSIGNMENT_ACCEPTED'
  | 'ASSIGNMENT_REJECTED'
  | 'LOCATION_UPDATED'
  | 'STATUS_CHANGED';

export interface CRMDispatchPayload {
  orderId: string;
  chefName: string;
  customerName: string;
  pickupAddress: string;
  dropAddress: string;
  items: { name: string; quantity: number }[];
  distanceKm: number;
  deliveryFee: number;
  etaMinutes: number;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  expiryTime: string;
}
