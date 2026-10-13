import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { DashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';
import { DateRangeOption } from '../types/dashboard';

export const getDashboardOverview = asyncHandler(async (req: Request, res: Response) => {
  const stats = await DashboardService.getOverview();
  sendSuccess(res, 'Dashboard overview retrieved', stats);
});

export const getFinanceSummary = asyncHandler(async (req: Request, res: Response) => {
  const range = req.query.range as DateRangeOption;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  const data = await DashboardService.getFinanceSummary(range, startDate, endDate);
  sendSuccess(res, 'Finance summary retrieved', data);
});

export const getRevenueAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const range = req.query.range as DateRangeOption;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  const data = await DashboardService.getRevenueAnalytics(range, startDate, endDate);
  sendSuccess(res, 'Revenue analytics retrieved', data);
});

export const getOrdersSummary = asyncHandler(async (req: Request, res: Response) => {
  const range = req.query.range as DateRangeOption;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  const data = await DashboardService.getOrdersSummary(range, startDate, endDate);
  sendSuccess(res, 'Orders summary retrieved', data);
});

export const getPaymentSummary = asyncHandler(async (req: Request, res: Response) => {
  const range = req.query.range as DateRangeOption;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  const data = await DashboardService.getPaymentSummary(range, startDate, endDate);
  sendSuccess(res, 'Payment summary retrieved', data);
});

export const getSettlementsSummary = asyncHandler(async (req: Request, res: Response) => {
  const range = req.query.range as DateRangeOption;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  const data = await DashboardService.getSettlementsSummary(range, startDate, endDate);
  sendSuccess(res, 'Settlements summary retrieved', data);
});

export const getTopChefs = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 5;
  const range = req.query.range as DateRangeOption;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  const data = await DashboardService.getTopChefs(limit, range, startDate, endDate);
  sendSuccess(res, 'Top chefs retrieved', data);
});

export const getTopSocieties = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 5;
  const range = req.query.range as DateRangeOption;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  const data = await DashboardService.getTopSocieties(limit, range, startDate, endDate);
  sendSuccess(res, 'Top societies retrieved', data);
});

export const getRecentFinancialActivity = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const data = await DashboardService.getRecentFinancialActivity(limit);
  sendSuccess(res, 'Recent financial activity retrieved', data);
});

export const getPerformanceMetrics = asyncHandler(async (req: Request, res: Response) => {
  const range = req.query.range as DateRangeOption;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  const data = await DashboardService.getPerformanceMetrics(range, startDate, endDate);
  sendSuccess(res, 'Performance metrics retrieved', data);
});
