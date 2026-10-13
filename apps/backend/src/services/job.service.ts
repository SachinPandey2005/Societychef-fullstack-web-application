import { internalEventBus, EVENTS } from '../events/eventEmitter';
import { logger } from '../utils/logger';
import { NotificationRepository } from '../repositories/notification.repository';
import { PushService } from './push.service';
import { RealtimeService } from './realtime.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { WhatsappService } from './whatsapp.service';

export interface Job {
  id: string;
  type: string;
  payload: any;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRY_WAIT';
  retryCount: number;
  nextRetryAt?: number;
}

/**
 * Background Job Abstraction Layer
 * Swappable with BullMQ / SQS. Currently uses an in-memory queue and setInterval.
 */
class JobQueue {
  private queue: Job[] = [];
  private processing = false;

  constructor() {
    // Process jobs via event listener for immediate triggering
    internalEventBus.on('NEW_JOB_ENQUEUED', () => {
      this.processNext().catch(err => logger.error('Job processing error', err));
    });
    
    // Polling interval to catch RETRY_WAIT jobs whose time has come
    const timer = setInterval(() => {
      const now = Date.now();
      let hasReadyJobs = false;
      for (const job of this.queue) {
        if (job.status === 'RETRY_WAIT' && job.nextRetryAt && now >= job.nextRetryAt) {
          job.status = 'PENDING';
          hasReadyJobs = true;
        }
      }
      if (hasReadyJobs) {
        internalEventBus.emit('NEW_JOB_ENQUEUED', {});
      }
    }, 5000);
    if (timer && typeof timer.unref === 'function') {
      timer.unref();
    }
  }

  async enqueue(type: string, payload: any) {
    const job: Job = {
      id: crypto.randomUUID(),
      type,
      payload,
      status: 'PENDING',
      retryCount: 0
    };
    this.queue.push(job);
    logger.info(`Job enqueued: [${type}] ${job.id}`);
    
    // Trigger processing
    internalEventBus.emit('NEW_JOB_ENQUEUED', { jobId: job.id });
    
    return job.id;
  }

  private async processNext() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const jobIndex = this.queue.findIndex(j => j.status === 'PENDING');
    if (jobIndex === -1) {
      this.processing = false;
      return;
    }

    const job = this.queue[jobIndex];
    job.status = 'PROCESSING';
    
    try {
      logger.info(`Processing job: ${job.id}`);
      // Basic router
      if (job.type === 'PROCESS_NOTIFICATION') {
        const payload = job.payload;
        const preferences = await NotificationRepository.getPreferences(payload.profile_id);

        if (preferences.in_app_enabled) {
          await NotificationRepository.createNotification(payload);
          await RealtimeService.broadcastEvent(`user:${payload.profile_id}`, 'NEW_NOTIFICATION', payload);
        }

        if (preferences.push_enabled && !(payload.type === 'PROMOTIONAL' && !preferences.promotional_enabled)) {
          const tokens = await NotificationRepository.getDeviceTokens(payload.profile_id);
          if (tokens.length > 0) {
            await PushService.sendPushNotification(tokens, payload.title, payload.message, { 
              type: payload.type, 
              entity_id: payload.entity_id 
            });
          }
        }

        // Additional channels logic (mocked profile contact info)
        const mockPhone = '+919876543210';
        const mockEmail = 'user@example.com';
        
        // Let's assume order updates go via Email & WhatsApp, while chef alerts go via SMS
        if (payload.type === 'ORDER_STATUS' || payload.type === 'ORDER_UPDATE') {
           await EmailService.sendEmail(mockEmail, payload.title, payload.message);
           await WhatsappService.sendWhatsappMessage(mockPhone, payload.message);
        } else if (payload.type === 'CHEF_ALERT') {
           await SmsService.sendSms(mockPhone, `[CHEF ALERT]: ${payload.title} - ${payload.message}`);
        } else if (payload.type === 'PROMOTIONAL' && preferences.promotional_enabled) {
           await EmailService.sendEmail(mockEmail, payload.title, payload.message);
        }

      } else if (job.type === 'SEND_EMAIL') {
        await EmailService.sendEmail(job.payload.to, job.payload.subject, job.payload.body);
      }
      
      job.status = 'COMPLETED';
      internalEventBus.emit(EVENTS.JOB_COMPLETED, { jobId: job.id, type: job.type });
    } catch (err) {
      logger.error(`Job failed: ${job.id}`, err);
      job.retryCount++;
      if (job.retryCount > 3) {
        job.status = 'FAILED';
      } else {
        job.status = 'RETRY_WAIT';
        // Exponential backoff: 10s, 20s, 40s
        job.nextRetryAt = Date.now() + (Math.pow(2, job.retryCount) * 5000);
        logger.info(`Job ${job.id} will retry at ${new Date(job.nextRetryAt).toISOString()}`);
      }
    } finally {
      this.processing = false;
      // Cleanup completed/failed jobs from memory to prevent leaks
      if (job.status === 'COMPLETED' || job.status === 'FAILED') {
        this.queue = this.queue.filter(j => j.id !== job.id);
      }
      // Process next job in queue if any exist
      if (this.queue.some(j => j.status === 'PENDING')) {
        internalEventBus.emit('NEW_JOB_ENQUEUED', {});
      }
    }
  }

  getMetrics() {
    return {
      pending: this.queue.filter(j => j.status === 'PENDING').length,
      processing: this.queue.filter(j => j.status === 'PROCESSING').length,
    };
  }
}

export const JobService = new JobQueue();
