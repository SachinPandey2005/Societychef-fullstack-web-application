export interface Dish {
  id: string;
  kitchen_id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  image_url?: string;
  is_available: boolean;
  is_archived: boolean;
  created_at?: string;
  updated_at?: string;
}

export type CreateDishInput = Omit<Dish, 'id' | 'created_at' | 'updated_at' | 'is_archived'>;
export type UpdateDishInput = Partial<Omit<Dish, 'id' | 'created_at' | 'updated_at'>>;
