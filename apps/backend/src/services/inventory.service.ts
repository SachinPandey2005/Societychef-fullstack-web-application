import { InventoryRepository } from '../repositories/inventory.repository';
import { internalEventBus, EVENTS } from '../events/eventEmitter';
import { logger } from '../utils/logger';
import { supabase } from '../config/supabase';

export class InventoryService {
  static init() {
    internalEventBus.on(EVENTS.ORDER_COMPLETED, async (order) => {
      logger.info(`Processing inventory deduction for completed order ${order.id}`);
      try {
        await this.processOrderDeduction(order.id, order.kitchen_id);
      } catch (err) {
        // We log the error but don't fail the order flow
        logger.error(`Failed to deduct inventory for order ${order.id}`, err);
      }
    });
  }

  static async createIngredient(kitchen_id: string, name: string, category: string, unit: string, cost_per_unit: number, shelf_life_days?: number, min_stock_level: number = 0) {
    return InventoryRepository.createIngredient({
      kitchen_id, name, category, unit, cost_per_unit, shelf_life_days, is_active: true
    }, min_stock_level);
  }

  static async addRecipeIngredient(dish_id: string, ingredient_id: string, quantity_required: number) {
    return InventoryRepository.addRecipeIngredient({ dish_id, ingredient_id, quantity_required });
  }

  static async getInventory(kitchen_id: string) {
    return InventoryRepository.getInventory(kitchen_id);
  }

  static async adjustStock(ingredient_id: string, type: 'ADD' | 'DEDUCT' | 'ADJUST', amount: number, reason: string = 'MANUAL') {
    const change = type === 'ADD' ? amount : -amount;
    const record = await InventoryRepository.adjustStock(ingredient_id, change, reason);
    
    internalEventBus.emit(EVENTS.STOCK_UPDATED, record);
    this.checkLowStock(record);
    
    return record;
  }

  static async logWastage(ingredient_id: string, quantity_lost: number, reason: string) {
    const invRecord = await InventoryRepository.getInventoryRecord(ingredient_id);
    
    // Fetch ingredient to get cost
    const { data: ing } = await supabase.from('ingredients').select('cost_per_unit').eq('id', ingredient_id).single();
    const financial_loss = (ing?.cost_per_unit || 0) * quantity_lost;

    await InventoryRepository.logWastage({
      inventory_id: invRecord.id,
      quantity_lost,
      reason,
      financial_loss
    });

    return this.adjustStock(ingredient_id, 'DEDUCT', quantity_lost, 'WASTAGE');
  }

  static async processOrderDeduction(order_id: string, kitchen_id: string) {
    // 1. Fetch order items
    const { data: orderItems } = await supabase.from('order_items').select('dish_id, quantity').eq('order_id', order_id);
    if (!orderItems) return;

    // 2. Map dishes to recipe ingredients
    for (const item of orderItems) {
      const recipeIngredients = await InventoryRepository.getRecipeForDish(item.dish_id);
      
      for (const req of recipeIngredients) {
        const totalToDeduct = req.quantity_required * item.quantity;
        const invRecord = await InventoryRepository.adjustStock(req.ingredient_id, -totalToDeduct, `ORDER_${order_id}`);
        this.checkLowStock(invRecord);
      }
    }
  }

  static checkLowStock(record: any) {
    if (record.quantity <= record.min_stock_level) {
      logger.warn(`Low stock alert for inventory ID: ${record.id}`);
      internalEventBus.emit(EVENTS.LOW_STOCK_ALERT, record);
    }
  }
}

// Initialize listener
InventoryService.init();
