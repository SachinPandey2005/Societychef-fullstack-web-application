export interface Conversation {
  id: string;
  order_id?: string; 
  consumer_id?: string;
  kitchen_id?: string;
  participant_1_id?: string;
  participant_2_id?: string;
  thread_type: 'ORDER' | 'SUPPORT';
  created_at?: string;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string; // Profile ID
  body: string;
  media_url?: string;
  is_read: boolean;
  status: 'SENT' | 'DELIVERED' | 'READ';
  created_at?: string;
}

export interface CreateMessageInput {
  thread_id: string;
  sender_id: string;
  body: string;
  media_url?: string;
}
