import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const requireSecureUpload = (req: Request, res: Response, next: NextFunction) => {
  // If no file in request, just proceed
  // @ts-ignore
  if (!req.file && !req.files) return next();

  // @ts-ignore
  const files = req.file ? [req.file] : Object.values(req.files).flat();

  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      logger.warn(`Rejected file upload due to invalid MIME type: ${file.mimetype}`);
      return sendError(res, 'Invalid file type. Only JPG, PNG, and PDF are allowed.', null, 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      logger.warn(`Rejected file upload due to size: ${file.size}`);
      return sendError(res, 'File size exceeds the 5MB limit.', null, 400);
    }
  }

  // Next steps would include passing to a Malware Scanner Service before saving
  next();
};
