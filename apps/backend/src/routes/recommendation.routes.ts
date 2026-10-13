import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getPersonalizedFeed, getTrending, submitFeedback, updatePreferences } from '../controllers/recommendation.controller';

const router = Router();

// Protect all recommendation routes (we need a user context for personalization)
router.use(requireAuth);

router.get('/feed', getPersonalizedFeed);
router.get('/trending', getTrending);
router.post('/feedback', submitFeedback);
router.patch('/preferences', updatePreferences);

export default router;
