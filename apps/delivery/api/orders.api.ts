import { apiClient } from './client';

export interface OrderItem {
  dish_id: string;
  quantity: number;
  price: number;
  dishes?: {
    name: string;
  };
}

export interface OrderDetails {
  id: string;
  order_number: string;
  kitchen_id: string;
  consumer_id: string;
  society_id: string;
  status: string;
  delivery_fee: number;
  items_total: number;
  grand_total: number;
  delivery_address: string;
  created_at: string;
  items?: OrderItem[];
  kitchens?: {
    name: string;
    chef_name: string;
    latitude: number;
    longitude: number;
    address: string;
  };
  profiles?: {
    full_name: string;
    phone: string;
  };
}

export const ordersApi = {
  getOrderDetails: async (orderId: string): Promise<OrderDetails> => {
    const response = await apiClient.get<OrderDetails>(`/orders/${orderId}`);
    return response.data;
  },
};

export default ordersApi;
