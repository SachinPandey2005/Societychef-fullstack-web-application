import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { 
  getKnowledgeArticles, 
  createKnowledgeArticle, 
  chatWithAI, 
  getTicketSuggestions 
} from '../controllers/ai.controller';

const router = Router();

router.use(requireAuth);

// Consumer & Chef & Ops Endpoints
router.get('/kb/articles', getKnowledgeArticles);
router.post('/chat', chatWithAI);

// Ops & Admin Endpoints
router.post('/kb/articles', requireRole(['admin', 'SUPER_ADMIN', 'OPERATIONS']), createKnowledgeArticle);
router.get('/tickets/:id/suggestions', requireRole(['admin', 'SUPER_ADMIN', 'OPERATIONS']), getTicketSuggestions);

export default router;
