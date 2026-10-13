export type DeliveryStatus = 
  | 'ASSIGNED' 
  | 'ACCEPTED' 
  | 'REJECTED' 
  | 'AT_PICKUP' 
  | 'PICKED_UP' 
  | 'OUT_FOR_DELIVERY' 
  | 'REACHED_CUSTOMER' 
  | 'DELIVERED' 
  | 'CANCELLED' 
  | 'FAILED';

export interface DeliveryPartner {
  id: string; // references profiles.id
  user_id?: string;
  vehicle_details: string;
  license_number: string;
  is_online: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  current_lat?: number;
  current_lng?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DeliveryAssignment {
  id: string;
  order_id: string;
  partner_id: string;
  status: DeliveryStatus;
  pickup_otp: string;
  delivery_otp: string;
  assigned_at?: string;
  accepted_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
}

export interface DeliveryTracking {
  id: string;
  assignment_id: string;
  lat: number;
  lng: number;
  timestamp: string;
}

export interface DeliveryEarnings {
  id: string;
  assignment_id: string;
  partner_id: string;
  amount: number;
  status: 'PENDING' | 'PAID';
  created_at?: string;
}
