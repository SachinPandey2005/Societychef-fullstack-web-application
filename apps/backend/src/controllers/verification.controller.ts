import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { VerificationService } from '../services/verification.service';
import { sendSuccess } from '../utils/response';
import { searchSchema } from '../validators/crm.schema';
import { updateVerificationStatusSchema } from '../validators/verification.schema';

export const getPendingVerifications = asyncHandler(async (req: Request, res: Response) => {
  const { query } = searchSchema.parse({ query: req.query });
  const verifications = await VerificationService.getPendingVerifications(query.page, query.limit);
  sendSuccess(res, 'Pending verifications retrieved', verifications);
});

export const updateVerificationStatus = asyncHandler(async (req: Request, res: Response) => {
  const admin_id = req.user!.id;
  const { params, body } = updateVerificationStatusSchema.parse({ params: req.params, body: req.body });
  
  const notesToUse = body.notes || body.verification_notes;
  const verification = await VerificationService.updateStatus(admin_id, params.id, body.status, notesToUse);
  sendSuccess(res, `Verification status updated to ${body.status}`, verification);
});
