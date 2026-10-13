import { JobService } from '../services/job.service';
import { PushService } from '../services/push.service';
import { RealtimeService } from '../services/realtime.service';
import { EmailService } from '../services/email.service';
import { SmsService } from '../services/sms.service';
import { WhatsappService } from '../services/whatsapp.service';
import { NotificationRepository } from '../repositories/notification.repository';
import { internalEventBus, EVENTS } from '../events/eventEmitter';

// Mock all external and dependent services
jest.mock('../services/push.service');
jest.mock('../services/realtime.service');
jest.mock('../services/email.service');
jest.mock('../services/sms.service');
jest.mock('../services/whatsapp.service');
jest.mock('../repositories/notification.repository');

describe('Phase 7: Notification Verification', () => {
  const mockProfileId = 'user_uuid';
  const mockTokens = ['ExponentPushToken[mock1]'];
  
  beforeEach(() => {
    jest.clearAllMocks();

    (NotificationRepository.createNotification as jest.Mock).mockResolvedValue(true);
    (NotificationRepository.getDeviceTokens as jest.Mock).mockResolvedValue(mockTokens);
  });

  const waitForQueue = (ms = 50) => new Promise(resolve => setTimeout(resolve, ms));

  describe('1. Routing by Payload Type & Channels', () => {
    it('should route ORDER_UPDATE to Push, Email, Whatsapp, and Realtime', async () => {
      (NotificationRepository.getPreferences as jest.Mock).mockResolvedValue({
        in_app_enabled: true,
        push_enabled: true,
        promotional_enabled: true
      });

      const payload = {
        profile_id: mockProfileId,
        type: 'ORDER_UPDATE',
        title: 'Order Status',
        message: 'Your order is being prepared',
        entity_id: 'order_123'
      };

      await JobService.enqueue('PROCESS_NOTIFICATION', payload);
      await waitForQueue(); // Allow async job queue to process

      expect(NotificationRepository.createNotification).toHaveBeenCalledWith(payload);
      expect(RealtimeService.broadcastEvent).toHaveBeenCalledWith(`user:${mockProfileId}`, 'NEW_NOTIFICATION', payload);
      expect(PushService.sendPushNotification).toHaveBeenCalledWith(
        mockTokens, 
        payload.title, 
        payload.message, 
        { type: payload.type, entity_id: payload.entity_id }
      );
      expect(EmailService.sendEmail).toHaveBeenCalled();
      expect(WhatsappService.sendWhatsappMessage).toHaveBeenCalled();
      expect(SmsService.sendSms).not.toHaveBeenCalled();
    });

    it('should route CHEF_ALERT to SMS and skip Whatsapp/Email', async () => {
      (NotificationRepository.getPreferences as jest.Mock).mockResolvedValue({
        in_app_enabled: true,
        push_enabled: true,
        promotional_enabled: true
      });

      const payload = {
        profile_id: mockProfileId,
        type: 'CHEF_ALERT',
        title: 'New Order',
        message: 'You have a new order to prepare'
      };

      await JobService.enqueue('PROCESS_NOTIFICATION', payload);
      await waitForQueue();

      expect(SmsService.sendSms).toHaveBeenCalled();
      expect(EmailService.sendEmail).not.toHaveBeenCalled();
      expect(WhatsappService.sendWhatsappMessage).not.toHaveBeenCalled();
    });
  });

  describe('2. User Preferences', () => {
    it('should block PROMOTIONAL push notifications if promotional_enabled is false', async () => {
      (NotificationRepository.getPreferences as jest.Mock).mockResolvedValue({
        in_app_enabled: true,
        push_enabled: true,
        promotional_enabled: false
      });

      const payload = {
        profile_id: mockProfileId,
        type: 'PROMOTIONAL',
        title: 'Discount!',
        message: 'Get 50% off today'
      };

      await JobService.enqueue('PROCESS_NOTIFICATION', payload);
      await waitForQueue();

      expect(PushService.sendPushNotification).not.toHaveBeenCalled();
      expect(EmailService.sendEmail).not.toHaveBeenCalled(); // Promotional email requires flag too
    });

    it('should block all push notifications if push_enabled is false', async () => {
      (NotificationRepository.getPreferences as jest.Mock).mockResolvedValue({
        in_app_enabled: true,
        push_enabled: false,
        promotional_enabled: true
      });

      const payload = {
        profile_id: mockProfileId,
        type: 'ORDER_UPDATE',
        title: 'Order Status',
        message: 'Your order is being prepared'
      };

      await JobService.enqueue('PROCESS_NOTIFICATION', payload);
      await waitForQueue();

      expect(PushService.sendPushNotification).not.toHaveBeenCalled();
      // Email and Whatsapp will still fire because they aren't explicitly gated by push_enabled in the current logic
      expect(EmailService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('3. Job Queue Logic', () => {
    it('should enqueue and successfully complete a raw SEND_EMAIL job', async () => {
      const jobId = await JobService.enqueue('SEND_EMAIL', {
        to: 'test@test.com',
        subject: 'Test',
        body: 'Hello'
      });

      // At this instant, it might be PROCESSING or already COMPLETED depending on event loop.
      // We will wait for queue.
      await waitForQueue();
      
      expect(EmailService.sendEmail).toHaveBeenCalledWith('test@test.com', 'Test', 'Hello');
      
      // Since it's completed, it should be removed from the queue
      const metrics = JobService.getMetrics();
      expect(metrics.pending).toBe(0);
      expect(metrics.processing).toBe(0);
    });
  });
});
