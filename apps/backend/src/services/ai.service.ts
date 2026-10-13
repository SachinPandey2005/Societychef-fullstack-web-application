import { KnowledgeService } from './knowledge.service';
import { AIProviderFactory } from './ai_provider.service';
import { AIRepository } from '../repositories/ai.repository';
import { internalEventBus, EVENTS } from '../events/eventEmitter';
import { logger } from '../utils/logger';

export class AIService {
  static init() {
    internalEventBus.on(EVENTS.TICKET_CREATED, async (ticket) => {
      logger.info(`AI classifying new ticket ${ticket.id}`);
      try {
        await this.classifyTicketAdvisory(ticket);
      } catch (err) {
        logger.error(`AI Classification failed for ticket ${ticket.id}`, err);
      }
    });
  }

  static async handleChatPrompt(session_id: string, message: string) {
    // 1. Search KB for context
    const kbResults = await KnowledgeService.searchKnowledge(message);
    const contextStr = kbResults.map(r => r.content).join('\n');

    // 2. Pass to AI Provider
    const provider = AIProviderFactory.getProvider();
    const reply = await provider.generateText(message, contextStr);

    // 3. Save to History
    await AIRepository.saveChatMessage({ session_id, role: 'USER', content: message });
    await AIRepository.saveChatMessage({ session_id, role: 'ASSISTANT', content: reply });

    return reply;
  }

  static async classifyTicketAdvisory(ticket: any) {
    const provider = AIProviderFactory.getProvider();
    const classification = await provider.classifyTicket(ticket.description || 'No description');
    
    // Save as an *Advisory* suggestion. Does NOT override ticket status directly.
    const suggestion = await AIRepository.saveTicketSuggestion({
      ticket_id: ticket.id,
      suggested_priority: classification.priority as any,
      suggested_category: classification.category,
      suggested_reply: classification.suggested_reply,
      sentiment: classification.sentiment as any
    });

    internalEventBus.emit(EVENTS.AI_TICKET_CLASSIFIED, suggestion);
    return suggestion;
  }

  static async getTicketSuggestions(ticket_id: string) {
    return AIRepository.getTicketSuggestions(ticket_id);
  }
}

AIService.init();
