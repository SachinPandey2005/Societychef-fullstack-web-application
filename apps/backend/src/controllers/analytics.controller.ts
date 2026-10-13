import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AnalyticsService } from '../services/analytics.service';
import { sendSuccess } from '../utils/response';

export const getAnalyticsOverview = asyncHandler(async (req: Request, res: Response) => {
  const startDate = req.query.start_date as string;
  const endDate = req.query.end_date as string;
  const societyId = req.query.society_id as string;
  const overview = await AnalyticsService.getOverview(startDate, endDate, societyId);
  sendSuccess(res, 'Analytics overview retrieved', overview);
});

export const getTopChefs = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const sortBy = (req.query.sort_by as string) || 'revenue';
  const data = await AnalyticsService.getTopChefs(limit, sortBy);
  sendSuccess(res, 'Top chefs leaderboard retrieved', data);
});

export const getTopKitchens = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const sortBy = (req.query.sort_by as string) || 'revenue';
  const data = await AnalyticsService.getTopKitchens(limit, sortBy);
  sendSuccess(res, 'Top kitchens leaderboard retrieved', data);
});

export const getRevenueAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const data = await AnalyticsService.getRevenueAnalytics();
  sendSuccess(res, 'Revenue analytics retrieved', data);
});

export const getPaymentAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const data = await AnalyticsService.getPaymentAnalytics();
  sendSuccess(res, 'Payment analytics retrieved', data);
});

export const getSettlementAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const data = await AnalyticsService.getSettlementAnalytics();
  sendSuccess(res, 'Settlement analytics retrieved', data);
});

export const getRefundAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const data = await AnalyticsService.getRefundAnalytics();
  sendSuccess(res, 'Refund analytics retrieved', data);
});

