import { NotificationRepository } from '../repositories/notification.repository';
import { CreateNotificationInput } from '../types/notification';
import { PushService } from './push.service';
import { RealtimeService } from './realtime.service';

import { JobService } from './job.service';

export class NotificationService {
  static async sendNotification(payload: CreateNotificationInput) {
    // Move expensive sync work to background job
    await JobService.enqueue('PROCESS_NOTIFICATION', payload);
  }

  static async getNotifications(profile_id: string) {
    return NotificationRepository.getNotifications(profile_id);
  }

  static async markAsRead(profile_id: string, notification_ids: string[]) {
    return NotificationRepository.markAsRead(profile_id, notification_ids);
  }

  static async registerDevice(profile_id: string, token: string) {
    return NotificationRepository.registerDevice(profile_id, token);
  }

  static async updatePreferences(profile_id: string, updates: any) {
    return NotificationRepository.updatePreferences(profile_id, updates);
  }

  static async getPreferences(profile_id: string) {
    return NotificationRepository.getPreferences(profile_id);
  }
}
