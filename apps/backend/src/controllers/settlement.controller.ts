import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { SettlementService } from '../services/settlement.service';
import { PayoutService } from '../services/payout.service';
import { sendSuccess } from '../utils/response';

export const getSettlements = asyncHandler(async (req: Request, res: Response) => {
  const settlements = await SettlementService.getSettlementsExtended(req.query);
  sendSuccess(res, 'Settlements retrieved', settlements);
});

export const getSettlementSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await SettlementService.getSettlementSummaryMetrics();
  sendSuccess(res, 'Settlement summary metrics retrieved', summary);
});

export const getSettlementDetails = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const details = await SettlementService.getSettlementDetails(id);
  sendSuccess(res, 'Settlement details retrieved', details);
});

export const generateSettlement = asyncHandler(async (req: Request, res: Response) => {
  const { kitchen_id, period_start, period_end } = req.body;
  const settlement = await SettlementService.generateSettlement(kitchen_id, period_start, period_end);
  sendSuccess(res, 'Settlement generated', settlement, 201);
});

export const bulkGenerateSettlements = asyncHandler(async (req: Request, res: Response) => {
  const { period_start, period_end } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const result = await SettlementService.bulkGenerateSettlements(period_start || today, period_end || today);
  sendSuccess(res, `Bulk generated ${result.generated_count} settlements`, result);
});

export const updateSettlementStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;
  const actorId = req.user?.id;
  const updated = await SettlementService.updateStatus(id, status, actorId);
  sendSuccess(res, `Settlement status updated to ${status}`, updated);
});

export const bulkUpdateSettlementStatus = asyncHandler(async (req: Request, res: Response) => {
  const { ids, status } = req.body;
  const actorId = req.user?.id;
  const result = await SettlementService.bulkUpdateStatus(ids, status, actorId);
  sendSuccess(res, `Bulk updated ${result.count} settlements to ${status}`, result);
});

export const getKitchenSettlements = asyncHandler(async (req: Request, res: Response) => {
  const kitchenId = req.params.kitchenId as string;
  const settlements = await SettlementService.getSettlementsByKitchen(kitchenId);
  sendSuccess(res, 'Settlements retrieved', settlements);
});

export const getPendingSettlements = asyncHandler(async (req: Request, res: Response) => {
  const settlements = await SettlementService.getPendingSettlements();
  sendSuccess(res, 'Pending settlements retrieved', settlements);
});

export const exportSettlements = asyncHandler(async (req: Request, res: Response) => {
  const data = await SettlementService.exportSettlementsData(req.query);
  sendSuccess(res, 'Settlements export data generated', data);
});

export const payChefHandler = asyncHandler(async (req: Request, res: Response) => {
  const settlement_id = req.params.id as string;
  const { mode, manual_details } = req.body;
  const actor_id = req.user?.id;

  const result = await PayoutService.payChef({
    settlement_id,
    mode: mode || 'AUTOMATIC',
    manual_details,
    actor_id,
  });

  sendSuccess(res, 'Chef payout executed successfully', result);
});

export const retryChefPayoutHandler = asyncHandler(async (req: Request, res: Response) => {
  const settlement_id = req.params.id as string;
  const actor_id = req.user?.id;
  const result = await PayoutService.retryChefPayout(settlement_id, actor_id);
  sendSuccess(res, 'Payout attempt reset for retry', result);
});

export const getPayoutHistoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const settlement_id = req.params.id as string;
  const history = await PayoutService.getPayoutHistoryForSettlement(settlement_id);
  sendSuccess(res, 'Payout attempt history retrieved', history);
});

export const manualPaymentHandler = asyncHandler(async (req: Request, res: Response) => {
  const settlement_id = req.params.id as string;
  const { utr_number, bank_reference, payment_notes } = req.body;
  const actor_id = req.user?.id;

  const result = await PayoutService.payChef({
    settlement_id,
    mode: 'MANUAL',
    manual_details: { utr_number, bank_reference, payment_notes },
    actor_id,
  });

  sendSuccess(res, 'Manual payout recorded successfully', result);
});

export const reverseSettlement = asyncHandler(async (req: Request, res: Response) => {
  const settlement_id = req.params.id as string;
  const { reason } = req.body;
  const actor_id = req.user?.id;

  const result = await SettlementService.reverseSettlement(settlement_id, reason || 'Ops Admin Reversal', actor_id);
  sendSuccess(res, 'Settlement reversed successfully', result);
});

