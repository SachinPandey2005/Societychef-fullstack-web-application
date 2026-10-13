import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';

import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err);

  if (err instanceof ZodError) {
    const details = err.issues
      .map((i: any) => `${i.path.filter((p: any) => p !== 'body').join('.') || 'field'}: ${i.message}`)
      .join(', ');
    return sendError(res, details ? `Validation Error (${details})` : 'Validation Error', err.issues, 400);
  }

  if (err instanceof AppError) {
    return sendError(res, err.message, null, err.statusCode);
  }

  // Handle generic errors
  const statusCode = err.status || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal Server Error'
    : err.message || 'Internal Server Error';

  return sendError(res, message, process.env.NODE_ENV === 'development' ? err.stack : null, statusCode);
};
