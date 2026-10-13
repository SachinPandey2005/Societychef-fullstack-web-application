import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getReviewsForKitchen, createReview, deleteReview } from '../controllers/review.controller';

const router = Router();

// Public — reviews are shown on a kitchen's public profile.
router.get('/kitchen/:kitchenId', getReviewsForKitchen);

router.post('/', requireAuth, createReview);
router.delete('/:id', requireAuth, deleteReview);

export default router;
