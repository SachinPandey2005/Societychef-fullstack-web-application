import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ReportsService } from '../services/reports.service';
import { sendSuccess } from '../utils/response';

export const getOrdersReport = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user?.id;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  const data = await ReportsService.getOrdersReport(startDate, endDate, admin_id);
  sendSuccess(res, 'Orders report retrieved', data);
});

export const getRevenueReport = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user?.id;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  const data = await ReportsService.getRevenueReport(startDate, endDate, admin_id);
  sendSuccess(res, 'Revenue report retrieved', data);
});

export const getChefDailyReport = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user?.id;
  const data = await ReportsService.getChefEarningsReport('daily', req.query, admin_id);
  sendSuccess(res, 'Chef daily earnings report retrieved', data);
});

export const getChefWeeklyReport = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user?.id;
  const data = await ReportsService.getChefEarningsReport('weekly', req.query, admin_id);
  sendSuccess(res, 'Chef weekly earnings report retrieved', data);
});

export const getChefMonthlyReport = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user?.id;
  const data = await ReportsService.getChefEarningsReport('monthly', req.query, admin_id);
  sendSuccess(res, 'Chef monthly earnings report retrieved', data);
});

export const getChefEarningsOverview = asyncHandler(async (req: Request, res: Response) => {
  const kitchen_id = req.params.id as string;
  const overview = await ReportsService.getChefEarningsOverview(kitchen_id);
  sendSuccess(res, 'Chef earnings overview retrieved', overview);
});

export const getChefOrders = asyncHandler(async (req: Request, res: Response) => {
  const kitchen_id = req.params.id as string;
  const date = req.query.date as string;
  const orders = await ReportsService.getChefOrders(kitchen_id, date);
  sendSuccess(res, 'Chef orders breakdown retrieved', orders);
});

export const getExecutiveFinanceSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await ReportsService.getExecutiveFinanceSummary();
  sendSuccess(res, 'Executive finance summary retrieved', summary);
});

export const getSocietyPerformanceReport = asyncHandler(async (req: Request, res: Response) => {
  const data = await ReportsService.getSocietyPerformanceReport(req.query);
  sendSuccess(res, 'Society performance report retrieved', data);
});

export const getRefundReport = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user?.id;
  const period = (req.query.period as any) || 'daily';
  const data = await ReportsService.getRefundReport(period, admin_id);
  sendSuccess(res, 'Refund & adjustments report retrieved', data);
});

