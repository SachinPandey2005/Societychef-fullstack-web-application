import { Router } from 'express';
import { getNotifications, markAsRead, registerDevice, getPreferences, updatePreferences } from '../controllers/notification.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.route('/')
  .get(getNotifications);

router.patch('/read', markAsRead);
router.post('/device/register', registerDevice);

router.route('/preferences')
  .get(getPreferences)
  .patch(updatePreferences);

export default router;
