import { Expo } from 'expo-server-sdk';
import { logger } from '../utils/logger';

const expo = new Expo();

export class PushService {
  static async sendPushNotification(tokens: string[], title: string, body: string, data?: any) {
    const validTokens = tokens.filter(token => Expo.isExpoPushToken(token));
    
    if (validTokens.length === 0) return;

    const messages = validTokens.map(token => ({
      to: token,
      sound: 'default' as const,
      title,
      body,
      data,
    }));

    const chunks = expo.chunkPushNotifications(messages);

    // Send the chunks to the Expo push notification service
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        logger.error(`Error sending push notification chunk: ${error}`);
      }
    }
  }
}
