import { KnowledgeRepository } from '../repositories/knowledge.repository';

export class KnowledgeService {
  static async createArticle(title: string, content: string, category: string, tags?: string[]) {
    return KnowledgeRepository.createArticle({ title, content, category, tags: tags || [] });
  }

  static async searchKnowledge(query: string) {
    return KnowledgeRepository.searchArticles(query);
  }

  static async getAllArticles() {
    return KnowledgeRepository.getArticles();
  }
}
