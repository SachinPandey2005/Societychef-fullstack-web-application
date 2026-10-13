export interface UserPreference {
  id: string; // same as profile_id
  favorite_cuisines: string[];
  dietary_preferences: string[];
  price_preference: 'LOW' | 'MEDIUM' | 'HIGH';
  created_at?: string;
  updated_at?: string;
}

export type FeedbackAction = 'LIKE' | 'DISLIKE' | 'NOT_INTERESTED';
export type RecommendationItemType = 'DISH' | 'KITCHEN' | 'CHEF' | 'COUPON';

export interface RecommendationFeedback {
  id: string;
  profile_id: string;
  item_id: string;
  item_type: RecommendationItemType;
  action: FeedbackAction;
  created_at?: string;
}

export interface RecommendationResult {
  section_title: string;
  items: any[]; // Highly dynamic payload depending on the query
}
