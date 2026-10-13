import { CampaignRepository } from '../repositories/campaign.repository';
import { CampaignTarget } from '../types/campaign';
import { ProfileRepository } from '../repositories/profile.repository';
import { NotificationService } from './notification.service';

export class CampaignService {
  static async createCampaign(name: string, type: 'PUSH' | 'BANNER' | 'COUPON' | 'REFERRAL', target_audience: CampaignTarget, content: string, start_date: string, end_date?: string, target_id?: string) {
    const campaign = await CampaignRepository.createCampaign({
      name, type, target_audience, content, start_date, end_date, target_id, is_active: true
    });

    // Trigger Campaign Notification
    if (type === 'PUSH') {
      const allProfiles = await ProfileRepository.findAll();
      
      for (const profile of allProfiles) {
        let matches = true;
        
        if (target_audience === 'SOCIETY' && target_id && profile.society_id !== target_id) {
          matches = false;
        }
        
        if (target_audience === 'CHEFS' && profile.role !== 'chef') {
          matches = false;
        }
        
        if (matches) {
          await NotificationService.sendNotification({
            profile_id: profile.id,
            title: name,
            message: content,
            type: 'PROMOTIONAL',
            entity_type: 'campaign',
            entity_id: campaign.id
          });
        }
      }
    }

    return campaign;
  }

  static async getActiveCampaigns() {
    return CampaignRepository.getActiveCampaigns();
  }

  static async updateStatus(id: string, is_active: boolean) {
    return CampaignRepository.updateStatus(id, is_active);
  }
}
