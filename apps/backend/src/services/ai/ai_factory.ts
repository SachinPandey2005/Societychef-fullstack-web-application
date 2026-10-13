import { AIProvider } from './ai.provider.interface';
import { MockProvider } from './mock.provider';
import { logger } from '../../utils/logger';

export class AIFactory {
  /**
   * Resolves the active AI provider based on ENV configuration.
   * Enables seamless swapping of LLMs/ML engines.
   */
  static getProvider(): AIProvider {
    const providerStr = process.env.AI_PROVIDER || 'mock';
    
    logger.debug(`Resolving AI Provider: ${providerStr}`);
    
    // In future, you would add `case 'openai': return new OpenAIProvider();`
    switch (providerStr) {
      case 'mock':
      default:
        return new MockProvider();
    }
  }
}
