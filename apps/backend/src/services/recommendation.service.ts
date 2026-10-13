import { RecommendationRepository } from '../repositories/recommendation.repository';
import { CacheService } from './cache.service';
import { internalEventBus, EVENTS } from '../events/eventEmitter';
import { RecommendationItemType, FeedbackAction } from '../types/recommendation';
import { logger } from '../utils/logger';

export class RecommendationService {
  static init() {
    internalEventBus.on(EVENTS.ORDER_COMPLETED, async (order) => {
      // Invalidate society trending cache on new orders
      const society_id = order.society_id;
      if (society_id) {
        CacheService.delete(`trending_dishes_${society_id}`);
        CacheService.delete(`trending_kitchens_${society_id}`);
      }
    });
  }

  static async submitFeedback(profile_id: string, item_id: string, item_type: RecommendationItemType, action: FeedbackAction) {
    await RecommendationRepository.submitFeedback({ profile_id, item_id, item_type, action });
  }

  static async updatePreferences(profile_id: string, favorite_cuisines?: string[], dietary_preferences?: string[], price_preference?: 'LOW' | 'MEDIUM' | 'HIGH') {
    return RecommendationRepository.updatePreferences(profile_id, { favorite_cuisines, dietary_preferences, price_preference });
  }

  static async getTrendingInSociety(society_id: string) {
    const cacheKeyDishes = `trending_dishes_${society_id}`;
    const cacheKeyKitchens = `trending_kitchens_${society_id}`;

    let trendingDishes = await CacheService.get<any[]>(cacheKeyDishes);
    if (!trendingDishes) {
      trendingDishes = await RecommendationRepository.getTrendingDishes(society_id);
      await CacheService.set(cacheKeyDishes, trendingDishes, 600); // 10 min cache
    }

    let trendingKitchens = await CacheService.get<any[]>(cacheKeyKitchens);
    if (!trendingKitchens) {
      trendingKitchens = await RecommendationRepository.getTrendingKitchens(society_id);
      await CacheService.set(cacheKeyKitchens, trendingKitchens, 600);
    }

    return { trendingDishes, trendingKitchens };
  }

  static async getPersonalizedFeed(profile_id: string, society_id: string) {
    // 1. Get explicit preferences
    const preferences = await RecommendationRepository.getPreferences(profile_id);
    
    // 2. Get negative feedback to filter out items
    const dislikedIds = await RecommendationRepository.getDislikedItemIds(profile_id);

    // 3. Get base trending
    const { trendingDishes, trendingKitchens } = await this.getTrendingInSociety(society_id);

    // 4. Apply filtering based on dislikes and preferences (Simulating ML logic)
    const filteredDishes = trendingDishes.filter(d => !dislikedIds.includes(d.id));
    const filteredKitchens = trendingKitchens.filter(k => !dislikedIds.includes(k.id));

    // Future ML models would score items here instead of simple filtering.
    
    return [
      {
        section_title: 'Trending Near You',
        items: filteredDishes.slice(0, 5)
      },
      {
        section_title: 'Top Rated Kitchens',
        items: filteredKitchens.slice(0, 5)
      }
    ];
  }
}

RecommendationService.init();
