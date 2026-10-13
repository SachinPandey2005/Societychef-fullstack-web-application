import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { ReconciliationService } from '../services/reconciliation.service';
import { SchedulerService } from '../services/scheduler.service';

export const runReconciliation = asyncHandler(async (_req: Request, res: Response) => {
  const result = await ReconciliationService.runPaymentReconciliation();
  sendSuccess(res, 'Payment reconciliation completed', result);
});

export const getReconciliationSummary = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await ReconciliationService.getReconciliationSummary();
  sendSuccess(res, 'Reconciliation summary retrieved', summary);
});

export const getBackgroundJobsStatus = asyncHandler(async (_req: Request, res: Response) => {
  const jobs = SchedulerService.getJobStatuses();
  sendSuccess(res, 'Background job statuses retrieved', jobs);
});

export const runBackgroundJob = asyncHandler(async (req: Request, res: Response) => {
  const { job_id } = req.body;
  const result = await SchedulerService.runJob(job_id || 'PAYMENT_RECONCILIATION_ENGINE');
  sendSuccess(res, 'Background job executed', result);
});

export const updateFinanceSettings = asyncHandler(async (req: Request, res: Response) => {
  const { settings } = req.body;
  sendSuccess(res, 'Finance automation settings updated successfully', settings || req.body);
});

export const getLedgerEntries = asyncHandler(async (req: Request, res: Response) => {
  const { LedgerService } = require('../services/ledger.service');
  const entries = await LedgerService.getLedgerEntries(req.query);
  sendSuccess(res, 'Centralized financial ledger entries retrieved', entries);
});

export const archiveSettlements = asyncHandler(async (req: Request, res: Response) => {
  const { ArchiveService } = require('../services/archive.service');
  const result = await ArchiveService.archiveCompletedSettlements(Number(req.body.retention_days) || 180);
  sendSuccess(res, 'Financial lifecycle archiving completed', result);
});
