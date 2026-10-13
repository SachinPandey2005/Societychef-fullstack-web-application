import { ProfileRepository } from '../repositories/profile.repository';
import { CreateProfileInput, UpdateProfileInput } from '../types/profile';
import { NotFoundError } from '../utils/errors';

export class ProfileService {
  static async getAllProfiles() {
    return ProfileRepository.findAll();
  }

  static async getProfileById(id: string) {
    const profile = await ProfileRepository.findById(id);
    if (!profile) {
      throw new NotFoundError('Profile not found');
    }
    return profile;
  }

  static async createProfile(payload: CreateProfileInput) {
    // Basic business validation can go here
    return ProfileRepository.create(payload);
  }

  static async updateProfile(id: string, payload: UpdateProfileInput) {
    const updated = await ProfileRepository.update(id, payload);
    if (!updated) {
      throw new NotFoundError('Profile not found');
    }
    return updated;
  }

  static async deleteProfile(id: string) {
    // Verify exists
    await this.getProfileById(id);
    return ProfileRepository.delete(id);
  }
}
