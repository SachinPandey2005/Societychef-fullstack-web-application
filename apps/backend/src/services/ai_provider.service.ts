import { AIRepository } from '../repositories/ai.repository';
import { logger } from '../utils/logger';

export interface AIProvider {
  generateText(prompt: string, context?: string): Promise<string>;
  classifyTicket(ticketDescription: string): Promise<{ priority: string, category: string, sentiment: string, suggested_reply: string }>;
}

export class MockAIProvider implements AIProvider {
  async generateText(prompt: string, context: string = '', retries = 2): Promise<string> {
    try {
      // Sanitize input (Mock implementation)
      const sanitizedPrompt = prompt.replace(/ignore previous instructions/gi, '[REDACTED]');
      
      // Log usage
      await AIRepository.logUsage({
        provider: 'MOCK_OPENAI',
        action: 'generateText',
        prompt_tokens: sanitizedPrompt.length,
        completion_tokens: 50
      });

      return `This is a simulated AI response based on the knowledge context: ${context.slice(0, 50)}...`;
    } catch (error) {
      if (retries > 0) {
        logger.warn(`AI Provider failed, retrying... (${retries} left)`);
        return this.generateText(prompt, context, retries - 1);
      }
      throw error;
    }
  }

  async classifyTicket(ticketDescription: string) {
    // Mock static output to represent LLM structured output
    await AIRepository.logUsage({
      provider: 'MOCK_OPENAI',
      action: 'classifyTicket',
      prompt_tokens: ticketDescription.length,
      completion_tokens: 20
    });

    return {
      priority: 'MEDIUM',
      category: 'GENERAL',
      sentiment: 'NEUTRAL',
      suggested_reply: 'Thank you for reaching out. An agent will review this shortly.'
    };
  }
}

export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private apiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('OPENAI_API_KEY is not set. OpenAI calls will fail.');
    }
  }

  async generateText(prompt: string, context: string = '', retries = 2): Promise<string> {
    if (!this.apiKey) throw new Error('OpenAI API Key is missing');
    
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `Context: ${context}` },
            { role: 'user', content: prompt }
          ]
        })
      });
      
      if (!response.ok) throw new Error(`OpenAI API Error: ${response.statusText}`);
      
      const data = await response.json();
      
      // Log usage
      await AIRepository.logUsage({
        provider: 'OPENAI',
        action: 'generateText',
        prompt_tokens: data.usage?.prompt_tokens || 0,
        completion_tokens: data.usage?.completion_tokens || 0
      });

      return data.choices[0].message.content;
    } catch (error) {
      if (retries > 0) {
        logger.warn(`AI Provider failed, retrying... (${retries} left)`);
        return this.generateText(prompt, context, retries - 1);
      }
      throw error;
    }
  }

  async classifyTicket(ticketDescription: string) {
    if (!this.apiKey) throw new Error('OpenAI API Key is missing');
    
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: "json_object" },
        messages: [
          { role: 'system', content: 'You are a support AI. Classify the ticket. Output JSON with priority, category, sentiment, and suggested_reply.' },
          { role: 'user', content: ticketDescription }
        ]
      })
    });

    if (!response.ok) throw new Error(`OpenAI API Error: ${response.statusText}`);
    
    const data = await response.json();
    
    await AIRepository.logUsage({
      provider: 'OPENAI',
      action: 'classifyTicket',
      prompt_tokens: data.usage?.prompt_tokens || 0,
      completion_tokens: data.usage?.completion_tokens || 0
    });

    return JSON.parse(data.choices[0].message.content);
  }
}

export class AIProviderFactory {
  static getProvider(): AIProvider {
    const providerStr = process.env.AI_PROVIDER || 'openai';
    if (providerStr === 'mock') {
      return new MockAIProvider();
    }
    return new OpenAIProvider();
  }
}
