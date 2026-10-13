import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { ValidationError } from '../utils/errors';
import { StorageService } from '../services/storage.service';
import { z } from 'zod';

// The real Supabase Storage buckets this project uses (see
// neon-migration-status memory notes) — Storage itself stays on Supabase
// until Phase 5; this endpoint's job is only to stop the mobile client from
// talking to Supabase (and its RLS policies) directly for uploads.
const ALLOWED_BUCKETS = new Set(['chef-photos', 'chat-media', 'kitchen-media', 'chef-documents']);

/**
 * Generic authenticated media upload, replacing several near-identical
 * direct supabase.storage.from(bucket).upload(...) call sites in mobile
 * (chat.tsx, chef-register.tsx, profile.tsx, menu.tsx, dashboard.tsx).
 */
export const uploadMediaFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ValidationError('No file provided.');
  }

  const bucket = String(req.query.bucket || req.body.bucket || '');
  if (!ALLOWED_BUCKETS.has(bucket)) {
    throw new ValidationError(`Invalid bucket. Must be one of: ${Array.from(ALLOWED_BUCKETS).join(', ')}`);
  }

  const folder = String(req.query.folder || req.body.folder || req.user!.id);

  const url = await StorageService.uploadFile(bucket, folder, req.file.buffer, req.file.mimetype, req.file.originalname);
  sendSuccess(res, 'File uploaded successfully', { url });
});

const deleteMediaSchema = z.object({
  body: z.object({
    bucket: z.string(),
    path: z.string().min(1),
  })
});

export const deleteMediaFile = asyncHandler(async (req: Request, res: Response) => {
  const { body } = deleteMediaSchema.parse({ body: req.body });
  if (!ALLOWED_BUCKETS.has(body.bucket)) {
    throw new ValidationError(`Invalid bucket. Must be one of: ${Array.from(ALLOWED_BUCKETS).join(', ')}`);
  }
  await StorageService.deleteFile(body.bucket, body.path);
  sendSuccess(res, 'File deleted successfully');
});
