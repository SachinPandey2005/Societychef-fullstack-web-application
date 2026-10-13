import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../db/client';
import { notifications, notificationPreferences, deviceTokens } from '../db/schema';
import { rowToSnakeCase, rowsToSnakeCase, toCamelCaseInput } from '../db/caseMapper';
import { CreateNotificationInput, DeviceToken, Notification, NotificationPreference } from '../types/notification';

export class NotificationRepository {
  static async createNotification(payload: CreateNotificationInput): Promise<Notification> {
    const rows = await db
      .insert(notifications)
      .values({ ...(toCamelCaseInput(payload) as any), isRead: false })
      .returning();
    return rowToSnakeCase<Notification>(rows[0]);
  }

  static async getNotifications(profile_id: string): Promise<Notification[]> {
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.profileId, profile_id))
      .orderBy(desc(notifications.createdAt));
    return rowsToSnakeCase<Notification>(rows);
  }

  static async markAsRead(profile_id: string, notification_ids: string[]): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.profileId, profile_id), inArray(notifications.id, notification_ids)));
  }

  // Preferences
  static async getPreferences(profile_id: string): Promise<NotificationPreference> {
    const rows = await db.select().from(notificationPreferences).where(eq(notificationPreferences.profileId, profile_id)).limit(1);
    if (rows[0]) return rowToSnakeCase<NotificationPreference>(rows[0]);

    // Default preferences
    return {
      profile_id,
      push_enabled: true,
      in_app_enabled: true,
      promotional_enabled: false,
    };
  }

  static async updatePreferences(profile_id: string, updates: Partial<NotificationPreference>): Promise<NotificationPreference> {
    const values = toCamelCaseInput(updates) as any;
    const rows = await db
      .insert(notificationPreferences)
      .values({ profileId: profile_id, ...values })
      .onConflictDoUpdate({ target: notificationPreferences.profileId, set: values })
      .returning();
    return rowToSnakeCase<NotificationPreference>(rows[0]);
  }

  // Devices
  static async registerDevice(profile_id: string, token: string): Promise<DeviceToken> {
    const rows = await db
      .insert(deviceTokens)
      .values({ profileId: profile_id, token })
      .onConflictDoUpdate({ target: deviceTokens.token, set: { profileId: profile_id } })
      .returning();
    return rowToSnakeCase<DeviceToken>(rows[0]);
  }

  static async getDeviceTokens(profile_id: string): Promise<string[]> {
    const rows = await db.select({ token: deviceTokens.token }).from(deviceTokens).where(eq(deviceTokens.profileId, profile_id));
    return rows.map((r) => r.token);
  }
}
