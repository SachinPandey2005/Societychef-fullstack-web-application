import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { PartnerService } from '../services/partner.service';
import { z } from 'zod';
import {
  updatePartnerProfileSchema,
  uploadDocumentSchema,
  updateVehicleSchema,
  updateBankSchema,
} from '../validators/partner.schema';

export const getPartnerProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const profile = await PartnerService.getProfile(userId);
  sendSuccess(res, 'Partner profile retrieved successfully', profile);
});

export const updatePartnerProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  try {
    const { body } = updatePartnerProfileSchema.parse({ body: req.body });
    const profile = await PartnerService.updateProfile(userId, body);
    sendSuccess(res, 'Partner profile updated successfully', profile);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('[validation_debug] Zod validation error:', JSON.stringify(error.issues, null, 2));
    }
    throw error;
  }
});

export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { body } = uploadDocumentSchema.parse({ body: req.body });
  const document = await PartnerService.uploadDocument(userId, body);
  sendSuccess(res, 'Document uploaded successfully', document);
});

export const updateVehicleDetails = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { body } = updateVehicleSchema.parse({ body: req.body });
  const vehicle = await PartnerService.updateVehicle(userId, body);
  sendSuccess(res, 'Vehicle details updated successfully', vehicle);
});

export const updateBankDetails = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { body } = updateBankSchema.parse({ body: req.body });
  const bank = await PartnerService.updateBank(userId, body);
  sendSuccess(res, 'Bank details updated successfully', bank);
});

export const getKycStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const profile = await PartnerService.getProfile(userId);
  sendSuccess(res, 'KYC status retrieved successfully', {
    kyc_status: profile.partner.kyc_status,
    rejection_reason: profile.partner.rejection_reason,
    progress_percentage: profile.partner.progress_percentage,
    documents: profile.documents,
  });
});

export const uploadSelfie = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { document_url } = req.body;
  if (!document_url) {
    throw new Error('Selfie photo URL is required');
  }

  const document = await PartnerService.uploadDocument(userId, {
    document_type: 'selfie',
    document_url,
  });
  
  sendSuccess(res, 'Selfie verification uploaded successfully', document);
});

export const getSocietyAssignment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const assignment = await PartnerService.getSocietyAssignment(userId);
  sendSuccess(res, 'Society assignment details retrieved successfully', assignment);
});

export const submitKycVerification = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const partner = await PartnerService.submitKyc(userId);
  sendSuccess(res, 'KYC submitted for audit verification', partner);
});
