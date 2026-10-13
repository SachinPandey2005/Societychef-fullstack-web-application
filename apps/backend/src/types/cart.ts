export interface CartItem {
  id: string; // unique cart item id
  cart_id: string;
  dish_id: string;
  quantity: number;
  created_at?: string;
  updated_at?: string;
}

export interface Cart {
  id: string;
  profile_id: string; // Consumer's profile id
  kitchen_id: string | null; // A cart can only belong to one kitchen
  created_at?: string;
  updated_at?: string;
}
