export type PaymentStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'SUCCESS'
  | 'FAILED'
  | 'USER_DROPPED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type PaymentGateway = 'CASHFREE' | 'RAZORPAY';

export interface Payment {
  id: string;
  order_id: string; // Internal Order ID or Master Checkout ID
  consumer_id: string; // Internal Profile ID of consumer
  payment_gateway?: PaymentGateway;
  cf_order_id?: string;
  payment_session_id?: string;
  cf_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  amount: number; // Stored in rupees or paise
  currency: string;
  payment_method?: string;
  payment_status: PaymentStatus;
  payment_timestamp?: string;
  refund_status?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export type CreatePaymentInput = Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
