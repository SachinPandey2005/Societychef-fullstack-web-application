import { SocietyRepository } from '../repositories/society.repository';
import { CreateSocietyInput, UpdateSocietyInput } from '../types/society';
import { NotFoundError } from '../utils/errors';

export class SocietyService {
  static async getAllSocieties() {
    return SocietyRepository.findAll();
  }

  static async getSocietyById(id: string) {
    const society = await SocietyRepository.findById(id);
    if (!society) {
      throw new NotFoundError('Society not found');
    }
    return society;
  }

  static async createSociety(payload: CreateSocietyInput) {
    return SocietyRepository.create(payload);
  }

  static async updateSociety(id: string, payload: UpdateSocietyInput) {
    const updated = await SocietyRepository.update(id, payload);
    if (!updated) {
      throw new NotFoundError('Society not found');
    }
    return updated;
  }

  static async deleteSociety(id: string) {
    await this.getSocietyById(id);
    return SocietyRepository.delete(id);
  }
}
