import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { CommissionService } from '../services/commission.service';
import { sendSuccess } from '../utils/response';

export const getCommissionRules = asyncHandler(async (req: Request, res: Response) => {
  const rules = await CommissionService.getAllRules();
  sendSuccess(res, 'Commission rules retrieved', rules);
});

export const createCommissionRule = asyncHandler(async (req: Request, res: Response) => {
  const rule = await CommissionService.createRule(req.body);
  sendSuccess(res, 'Commission rule created', rule, 201);
});

export const updateCommissionRule = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const rule = await CommissionService.updateRule(id, req.body);
  sendSuccess(res, 'Commission rule updated', rule);
});

export const deleteCommissionRule = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await CommissionService.deleteRule(id);
  sendSuccess(res, 'Commission rule deleted', null);
});

export const calculateCommission = asyncHandler(async (req: Request, res: Response) => {
  const { order_id, grand_total, delivery_fee, kitchen_id, society_id } = req.body;
  const result = await CommissionService.calculateOrderCommission(
    order_id || 'test_order',
    Number(grand_total || 1000),
    Number(delivery_fee || 0),
    kitchen_id || 'test_kitchen',
    society_id
  );
  sendSuccess(res, 'Commission calculated', result);
});
