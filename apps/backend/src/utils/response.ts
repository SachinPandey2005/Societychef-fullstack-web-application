import { Response } from 'express';

export const sendSuccess = <T>(res: Response, message: string, data?: T, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: data || {},
  });
};

export const sendError = (res: Response, message: string, errors?: any, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: errors || null,
  });
};
