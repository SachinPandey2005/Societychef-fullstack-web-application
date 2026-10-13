import { Router } from 'express';
import { getMessages, sendMessage, sendSupportMessage, markAsRead, sendTyping, getOrCreateThread, getMyThreads, getThreadMessages, sendThreadMessage } from '../controllers/chat.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.route('/messages')
  .get(getMessages)
  .post(sendMessage);

router.post('/support', sendSupportMessage);
router.put('/messages/:threadId/read', markAsRead);
router.post('/messages/:threadId/typing', sendTyping);

// Kitchen-centric threads (see chat.controller.ts#getOrCreateThread)
router.post('/threads', getOrCreateThread);
router.get('/threads', getMyThreads);
router.get('/threads/:threadId/messages', getThreadMessages);
router.post('/threads/:threadId/messages', sendThreadMessage);

export default router;
