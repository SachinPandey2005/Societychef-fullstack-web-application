import { Router } from 'express';
import { DeveloperController } from '../controllers/developer.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Developer Portal is accessible to registered partners/devs
router.use(requireAuth);

router.post('/api-keys', DeveloperController.generateApiKey);
router.get('/webhooks', DeveloperController.listWebhooks);

export default router;
