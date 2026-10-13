import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { uploadMedia } from '../middleware/upload.middleware';
import { uploadMediaFile, deleteMediaFile } from '../controllers/media.controller';

const router = Router();

router.use(requireAuth);
router.post('/upload', uploadMedia.single('file'), uploadMediaFile);
router.delete('/', deleteMediaFile);

export default router;
