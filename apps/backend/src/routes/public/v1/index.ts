import { Router } from 'express';
import { requireApiKey } from '../../../middleware/apiKey.middleware';

const router = Router();

router.use(requireApiKey);

// Stub Public Endpoints for third-party developers
router.get('/ping', (req, res) => {
  res.json({ message: 'pong', appId: (req as any).developer?.appId });
});

export default router;
