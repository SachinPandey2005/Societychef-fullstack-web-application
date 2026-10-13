import { DishRepository } from '../repositories/dish.repository';
import { CreateDishInput, UpdateDishInput } from '../types/dish';
import { NotFoundError } from '../utils/errors';

export class DishService {
  static async getAllDishes(kitchenId?: string) {
    // Only return non-archived by default if needed, or filter at controller layer
    return DishRepository.findAll(kitchenId);
  }

  static async getDishById(id: string) {
    const dish = await DishRepository.findById(id);
    if (!dish) {
      throw new NotFoundError('Dish not found');
    }
    return dish;
  }

  static async createDish(payload: CreateDishInput) {
    return DishRepository.create(payload);
  }

  static async updateDish(id: string, payload: UpdateDishInput) {
    const updated = await DishRepository.update(id, payload);
    if (!updated) {
      throw new NotFoundError('Dish not found');
    }
    return updated;
  }

  static async toggleAvailability(id: string, is_available: boolean) {
    return this.updateDish(id, { is_available });
  }

  static async archiveDish(id: string) {
    // We update is_archived to true instead of hard deleting
    return this.updateDish(id, { is_archived: true });
  }

  static async deleteDish(id: string) {
    await this.getDishById(id);
    return DishRepository.delete(id);
  }
}
