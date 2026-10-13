import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { RefundService } from '../services/refund.service';
import { DisputeService } from '../services/dispute.service';
import { DisputeCase } from '../types/refund';

export const getRefunds = asyncHandler(async (req: Request, res: Response) => {
  const refunds = await RefundService.getRefunds(req.query);
  sendSuccess(res, 'Refund requests retrieved', refunds);
});

export const getRefundById = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const refund = await RefundService.getRefundById(id);
  sendSuccess(res, 'Refund details retrieved', refund);
});


export const requestRefund = asyncHandler(async (req: Request, res: Response) => {
  const { order_id, amount, reason, type } = req.body;
  const requested_by = req.user?.id;
  const result = await RefundService.requestRefund({
    order_id,
    amount: amount ? Number(amount) : undefined,
    reason,
    type,
    requested_by,
  });
  sendSuccess(res, 'Refund request submitted successfully', result, 201);
});

export const approveRefund = asyncHandler(async (req: Request, res: Response) => {
  const { refund_id } = req.body;
  const approver_id = req.user?.id || 'SYSTEM';
  const result = await RefundService.approveRefund(refund_id, approver_id);
  sendSuccess(res, 'Refund approved and processed successfully', result);
});

export const processRefund = asyncHandler(async (req: Request, res: Response) => {
  const { order_id, amount, reason, type, refund_id } = req.body;
  const actor_id = req.user?.id;
  const result = await RefundService.processRefund({
    order_id,
    amount: amount ? Number(amount) : undefined,
    reason,
    type,
    actor_id,
    refund_id,
  });
  sendSuccess(res, 'Refund processed successfully', result);
});

// Alias used by crm.routes.ts (legacy compatibility)
export const createRefundRequest = requestRefund;

export const getFinancialAdjustments = asyncHandler(async (req: Request, res: Response) => {
  const adjustments = await RefundService.getFinancialAdjustments();
  sendSuccess(res, 'Financial adjustments retrieved', adjustments);
});

export const createFinancialAdjustment = asyncHandler(async (req: Request, res: Response) => {
  const actor_id = req.user?.id;
  const result = await RefundService.createFinancialAdjustment({
    ...req.body,
    requested_by: actor_id,
  });
  sendSuccess(res, 'Financial adjustment created successfully', result, 201);
});

// --- Disputes ---
export const getDisputes = asyncHandler(async (req: Request, res: Response) => {
  const disputes = await DisputeService.getDisputes(req.query);
  sendSuccess(res, 'Dispute cases retrieved', disputes);
});

export const getDisputeById = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const dispute = await DisputeService.getDisputeById(id);
  sendSuccess(res, 'Dispute case details retrieved', dispute);
});

export const createDispute = asyncHandler(async (req: Request, res: Response) => {
  const actor_id = req.user?.id;
  const dispute = await DisputeService.createDispute(req.body, actor_id);
  sendSuccess(res, 'Dispute case created', dispute, 201);
});

export const updateDisputeStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { status, resolution_notes, assigned_agent_id } = req.body;
  const actor_id = req.user?.id;

  const updated = await DisputeService.updateDisputeStatus(
    id,
    String(status) as DisputeCase['status'],
    typeof resolution_notes === 'string' ? resolution_notes : undefined,
    actor_id,
    assigned_agent_id
  );
  sendSuccess(res, 'Dispute status updated', updated);
});

export const addDisputeComment = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { comment, is_internal } = req.body;
  const author_id = req.user?.id;
  const author_role = req.user?.role;

  const result = await DisputeService.addComment({
    dispute_id: id,
    comment,
    is_internal: Boolean(is_internal),
    author_id,
    author_role,
  });

  sendSuccess(res, 'Comment added to dispute', result, 201);
});

