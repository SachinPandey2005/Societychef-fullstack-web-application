import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { FraudService } from '../services/fraud.service';
import { sendSuccess } from '../utils/response';
import { createFraudRuleSchema, resolveFraudCaseSchema } from '../validators/fraud.schema';

export const createFraudRule = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createFraudRuleSchema.parse({ body: req.body });
  const rule = await FraudService.createRule(body);
  sendSuccess(res, 'Fraud Rule created', rule, 201);
});

export const resolveFraudCase = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = resolveFraudCaseSchema.parse({ params: req.params, body: req.body });
  const resolvedCase = await FraudService.resolveCase(params.id, body.status, body.resolution_notes);
  sendSuccess(res, 'Fraud Case resolved', resolvedCase);
});
