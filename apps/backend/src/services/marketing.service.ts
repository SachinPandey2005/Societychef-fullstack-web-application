import { MarketingRepository } from '../repositories/marketing.repository';
import { internalEventBus, EVENTS } from '../events/eventEmitter';
import { logger } from '../utils/logger';

export class MarketingService {
  static init() {
    // Abandoned Cart Automation
    internalEventBus.on(EVENTS.CART_UPDATED, (cart) => {
      // In-memory 30m delay simulation (for demo architecture)
      setTimeout(async () => {
        try {
          await this.triggerAbandonedCartCampaign(cart.consumer_id);
        } catch (err) {
          logger.error(`Abandoned cart trigger failed`, err);
        }
      }, 30 * 60 * 1000); 
    });

    // First Order Automation
    internalEventBus.on(EVENTS.ORDER_COMPLETED, async (order) => {
      try {
        await this.triggerPostOrderCampaign(order.consumer_id, order.id);
      } catch (err) {
        logger.error(`Post order campaign failed`, err);
      }
    });
  }

  static async getPreferences(profile_id: string) {
    return MarketingRepository.getPreferences(profile_id);
  }

  static async updatePreferences(profile_id: string, prefs: any) {
    return MarketingRepository.updatePreferences(profile_id, prefs);
  }

  static async createCampaign(name: string, channel: any, template: string, desc?: string, segment?: string, scheduled_at?: string) {
    return MarketingRepository.createCampaign({
      name, channel, content_template: template, description: desc, target_segment: segment, scheduled_at
    });
  }

  static async executeCampaign(campaign_id: string) {
    // 1. Fetch Campaign
    // 2. Fetch segment users
    // 3. For each user, check MarketingRepository.getPreferences(user_id)
    // 4. Dispatch to NotificationService if opted in
    // 5. Record engagement
    const campaign = await MarketingRepository.updateCampaignStatus(campaign_id, 'ACTIVE');
    
    logger.info(`Executing campaign: ${campaign.name}`);
    
    // Simulating dispatching to a specific profile segment
    // E.g. we grab user "123" who matches segment criteria
    const dummyUserId = "dummy-user-id";
    const prefs = await MarketingRepository.getPreferences(dummyUserId);

    // Hard rule: Always check opt-in
    if (campaign.channel === 'PUSH' && !prefs.push_opt_in) {
      logger.info(`User ${dummyUserId} opted out of PUSH. Skipping.`);
      return campaign;
    }

    // Call into existing notification system (mocked here as successful)
    // NotificationService.sendPush(...)
    
    // Log engagement
    await MarketingRepository.recordEngagement({
      profile_id: dummyUserId,
      campaign_id: campaign.id,
      status: 'SENT'
    });

    internalEventBus.emit(EVENTS.CAMPAIGN_EXECUTED, campaign);
    return campaign;
  }

  // --- Automations ---

  private static async triggerAbandonedCartCampaign(consumer_id: string) {
    logger.info(`Triggering Abandoned Cart check for ${consumer_id}`);
    const prefs = await MarketingRepository.getPreferences(consumer_id);
    if (!prefs.promotions_opt_in) return;
    
    // Dispatch reminder via Notification module
    logger.info(`Sending Abandoned Cart Reminder to ${consumer_id}`);
  }

  private static async triggerPostOrderCampaign(consumer_id: string, order_id: string) {
    logger.info(`Triggering Post Order Followup for ${consumer_id}`);
    const prefs = await MarketingRepository.getPreferences(consumer_id);
    if (!prefs.promotions_opt_in) return;

    // We can issue a coupon via existing CouponService
    logger.info(`Sending Post Order Thanks to ${consumer_id} for order ${order_id}`);
  }

  static async getCampaigns() {
    return MarketingRepository.getCampaigns();
  }

  static async getCampaignAnalytics(campaign_id: string) {
    return MarketingRepository.getCampaignAnalytics(campaign_id);
  }
}

MarketingService.init();
