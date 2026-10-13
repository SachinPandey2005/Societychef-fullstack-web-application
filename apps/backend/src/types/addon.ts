export interface DishAddon {
  id: string;
  dish_id: string;
  name: string;
  price: number;
  created_at?: string;
}

export type CreateAddonInput = { dish_id: string; name: string; price: number };
export type UpdateAddonInput = Partial<{ name: string; price: number }>;
