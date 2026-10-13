export type NotificationType = 
  | 'ORDER_STATUS'
  | 'PAYMENT_UPDATE'
  | 'NEW_ORDER'
  | 'KITCHEN_ALERT'
  | 'CHEF_ALERT'
  | 'ORDER_UPDATE'
  | 'CHAT_MESSAGE'
  | 'PROMOTIONAL'
  | 'FINANCE_ALERT'
  | 'DISPUTE_ESCALATED'
  | 'SUPPORT_TICKET';


export interface Notification {
  id: string;
  profile_id: string; // user_id
  title: string;
  message: string;
  type: NotificationType;
  entity_type?: string; // e.g. 'order', 'payment'
  entity_id?: string;
  is_read: boolean;
  created_at?: string;
}

export interface CreateNotificationInput {
  profile_id: string;
  title: string;
  message: string;
  type: NotificationType;
  entity_type?: string;
  entity_id?: string;
}

export interface NotificationPreference {
  profile_id: string;
  push_enabled: boolean;
  in_app_enabled: boolean;
  promotional_enabled: boolean;
}

export interface DeviceToken {
  profile_id: string;
  token: string; // Expo Push Token
  created_at?: string;
}
