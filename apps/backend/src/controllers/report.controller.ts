import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ReportService } from '../services/report.service';
import { sendSuccess } from '../utils/response';
import { analyticsFilterSchema } from '../validators/analytics.schema';

export const exportOrders = asyncHandler(async (req: Request, res: Response) => {
  const { query } = analyticsFilterSchema.parse({ query: req.query });
  const start_date = query.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const end_date = query.end_date || new Date().toISOString();
  
  const data = await ReportService.exportOrders(start_date, end_date);
  sendSuccess(res, 'Order export generated', data);
});
