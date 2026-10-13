export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  created_at?: string;
  updated_at?: string;
}

export interface TicketSuggestion {
  id: string;
  ticket_id: string;
  suggested_priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  suggested_category: string;
  suggested_reply: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  is_applied: boolean;
  created_at?: string;
}

export interface AIChatMessage {
  id: string;
  session_id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  created_at?: string;
}

export interface AIUsageLog {
  id: string;
  provider: string; // 'MOCK_OPENAI', 'MOCK_ANTHROPIC'
  action: string;
  prompt_tokens: number;
  completion_tokens: number;
  created_at?: string;
}
