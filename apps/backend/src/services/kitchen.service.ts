import { KitchenRepository } from '../repositories/kitchen.repository';
import { CreateKitchenInput, UpdateKitchenInput, KitchenStatus } from '../types/kitchen';
import { NotFoundError } from '../utils/errors';

export class KitchenService {
  static async getAllKitchens() {
    return KitchenRepository.findAll();
  }

  static async getKitchenById(id: string) {
    const kitchen = await KitchenRepository.findById(id);
    if (!kitchen) {
      throw new NotFoundError('Kitchen not found');
    }
    return kitchen;
  }

  static async createKitchen(payload: CreateKitchenInput) {
    return KitchenRepository.create(payload);
  }

  static async updateKitchen(id: string, payload: UpdateKitchenInput) {
    const updated = await KitchenRepository.update(id, payload);
    if (!updated) {
      throw new NotFoundError('Kitchen not found');
    }
    return updated;
  }

  static async updateKitchenStatus(id: string, is_live: boolean) {
    return this.updateKitchen(id, { is_live });
  }

  static async deleteKitchen(id: string) {
    await this.getKitchenById(id);
    return KitchenRepository.delete(id);
  }
}
