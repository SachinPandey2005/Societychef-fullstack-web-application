import { Router } from 'express';
import { getHealthStatus } from '../controllers/health.controller';

const router = Router();

// Publicly accessible for Load Balancers
router.get('/', getHealthStatus);

export default router;
