import { VehicleInfo } from '../store/useUserStore';

export type OrderStatus = 
  | 'assigned' 
  | 'preparing' 
  | 'ready_for_pickup' 
  | 'picked_up' 
  | 'delivered' 
  | 'cancelled';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface AddressDetails {
  flatNumber: string;
  tower: string;
  society: string;
  coordinates: LocationCoordinates;
  instructions?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
}

export interface DeliveryOrder {
  id: string;
  orderNumber: string;
  kitchenName: string;
  pickupAddress: AddressDetails;
  deliveryAddress: AddressDetails;
  items: OrderItem[];
  itemCount: number;
  estDistanceMeters: number;
  estPrepMinutes: number;
  earningsINR: number;
  status: OrderStatus;
  otpToComplete?: string;
  createdAt: string;
  completedAt?: string;
}

export interface EarningsSummary {
  todayTotal: number;
  weekTotal: number;
  walletBalance: number;
  incentivesEarned: number;
}

export interface LedgerTransaction {
  id: string;
  type: 'order_earnings' | 'cash_out' | 'incentive' | 'bonus' | 'deduction';
  amount: number;
  referenceId: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}
