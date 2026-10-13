export interface Ingredient {
  id: string;
  kitchen_id: string;
  name: string;
  category: string;
  unit: string;
  cost_per_unit: number;
  shelf_life_days?: number;
  is_active: boolean;
  created_at?: string;
}

export interface InventoryRecord {
  id: string;
  ingredient_id: string;
  kitchen_id: string;
  quantity: number;
  reserved_quantity: number;
  min_stock_level: number;
  updated_at?: string;
}

export interface RecipeIngredient {
  id: string;
  dish_id: string;
  ingredient_id: string;
  quantity_required: number;
}

export type TransactionType = 'ADD' | 'DEDUCT' | 'ADJUST' | 'WASTE' | 'PURCHASE';

export interface InventoryTransaction {
  id: string;
  inventory_id: string;
  type: TransactionType;
  amount: number;
  reason?: string;
  created_at?: string;
}

export interface PurchaseOrder {
  id: string;
  kitchen_id: string;
  vendor_name: string;
  total_cost: number;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  created_at?: string;
}

export interface WastageRecord {
  id: string;
  inventory_id: string;
  quantity_lost: number;
  reason: string;
  financial_loss: number;
  created_at?: string;
}
