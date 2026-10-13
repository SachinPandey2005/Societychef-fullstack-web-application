import { Router } from 'express';
import { DeviceController } from '../controllers/device.controller';
import { SyncController } from '../controllers/sync.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

// Stage 2: Device Management
router.post('/devices/register', DeviceController.register);
router.post('/devices/:deviceId/revoke', DeviceController.revoke);

// Stage 3-5: Synchronization & Deltas
router.get('/sync/orders', SyncController.syncOrders);
router.get('/sync/menus', SyncController.syncMenus);

export default router;
