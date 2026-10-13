import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { KnowledgeService } from '../services/knowledge.service';
import { AIService } from '../services/ai.service';
import { sendSuccess } from '../utils/response';
import { createArticleSchema, chatPromptSchema } from '../validators/ai.schema';
import { v4 as uuidv4 } from 'uuid';

// Knowledge Base
export const getKnowledgeArticles = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query.q as string;
  let articles;
  if (query) {
    articles = await KnowledgeService.searchKnowledge(query);
  } else {
    articles = await KnowledgeService.getAllArticles();
  }
  sendSuccess(res, 'Articles retrieved', articles);
});

export const createKnowledgeArticle = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createArticleSchema.parse({ body: req.body });
  const article = await KnowledgeService.createArticle(body.title, body.content, body.category, body.tags);
  sendSuccess(res, 'Article created', article, 201);
});

// Chatbot
export const chatWithAI = asyncHandler(async (req: Request, res: Response) => {
  const { body } = chatPromptSchema.parse({ body: req.body });
  const session_id = body.session_id || uuidv4();

  const reply = await AIService.handleChatPrompt(session_id, body.message);
  sendSuccess(res, 'AI Reply', { session_id, reply });
});

// Advisory Ticket Routing
export const getTicketSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const ticket_id = req.params.id as string;
  const suggestions = await AIService.getTicketSuggestions(ticket_id);
  sendSuccess(res, 'AI Suggestions retrieved', suggestions);
});
