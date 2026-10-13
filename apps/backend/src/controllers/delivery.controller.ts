import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { DeliveryService } from '../services/delivery.service';
import { DeliveryRepository } from '../repositories/delivery.repository';
import { sendSuccess } from '../utils/response';
import { registerPartnerSchema, updatePartnerStatusSchema, updateDeliveryStatusSchema, pushTrackingSchema } from '../validators/delivery.schema';
import { z } from 'zod';

export const registerPartner = asyncHandler(async (req: Request, res: Response) => {
  // vehicle_details/license_number are validated but not persisted here —
  // delivery_partners has no columns for either (vehicle registration docs
  // belong to the separate partner_vehicles table, not this endpoint). This
  // previously meant every registration attempt failed outright (insert
  // referenced columns that don't exist); now it at least creates the
  // partner record, matching the shape PartnerRepository.getOrCreatePartner
  // already uses successfully elsewhere.
  registerPartnerSchema.parse({ body: req.body });
  const partner = await DeliveryRepository.registerPartner({
    id: req.user!.id,
  });
  sendSuccess(res, 'Partner registered', partner, 201);
});

import { PartnerRepository } from '../repositories/partner.repository';

export const toggleOnlineStatus = asyncHandler(async (req: Request, res: Response) => {
  const { body } = updatePartnerStatusSchema.parse({ body: req.body });

  // delivery_partners.id is its own generated key, not the same value as
  // profiles.id (delivery_partners.user_id is the FK back to the profile) —
  // every delivery_assignments/delivery_earnings row keys off this id, not
  // the profile id. Passing req.user!.id straight through here previously
  // matched zero rows: DeliveryRepository.updatePartnerStatus's WHERE clause
  // never found this profile's row, Drizzle returned an empty array, and
  // rowToSnakeCase(undefined) threw — going online 500'd for every partner.
  const partner = await PartnerRepository.getOrCreatePartner(req.user!.id);

  if (body.is_online && partner.kyc_status !== 'APPROVED') {
    return res.status(403).json({
      success: false,
      message: 'Complete identity verification before accepting deliveries.',
    });
  }

  const updated = await DeliveryRepository.updatePartnerStatus(partner.id, body.is_online);
  sendSuccess(res, 'Status updated', updated);
});

/** Everything app/(rider)/index.tsx needs in one call — was previously a
 * fully hardcoded screen (one fake delivery, fake earnings, an online toggle
 * that persisted nowhere). */
export const getMySummary = asyncHandler(async (req: Request, res: Response) => {
  const partner = await PartnerRepository.getOrCreatePartner(req.user!.id);
  const [activeAssignments, todaySummary] = await Promise.all([
    DeliveryRepository.getActiveAssignmentsForPartner(partner.id),
    DeliveryRepository.getTodaySummaryForPartner(partner.id),
  ]);
  sendSuccess(res, 'Summary retrieved', {
    ...todaySummary,
    is_online: partner.is_online || false,
    active_assignments: activeAssignments,
  });
});

export const getAssignmentByOrder = asyncHandler(async (req: Request, res: Response) => {
  const orderId = req.params.orderId as string;
  const assignment = await DeliveryRepository.getAssignmentByOrder(orderId);
  sendSuccess(res, 'Assignment retrieved', assignment);
});

export const updateAssignmentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = updateDeliveryStatusSchema.parse({ params: req.params, body: req.body });
  // Same delivery_partners.id vs profiles.id distinction as toggleOnlineStatus
  // — DeliveryService.updateStatus checks assignment.partner_id (a
  // delivery_partners.id) against this value, so passing the raw profile id
  // meant every accept/reject/pickup/deliver call threw "Unauthorized" for
  // the assignment's own correct partner.
  const partner = await PartnerRepository.getOrCreatePartner(req.user!.id);

  const assignment = await DeliveryService.updateStatus(params.id, body.status, partner.id, body.otp);
  sendSuccess(res, 'Assignment status updated', assignment);
});

export const pushTrackingUpdate = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = pushTrackingSchema.parse({ params: req.params, body: req.body });
  const partner = await PartnerRepository.getOrCreatePartner(req.user!.id);

  await DeliveryService.pushTracking(params.id, body.lat, body.lng, partner.id);
  sendSuccess(res, 'Tracking updated');
});

export const getETA = asyncHandler(async (req: Request, res: Response) => {
  const { originLat, originLng, destLat, destLng } = req.query;
  
  if (!originLat || !originLng || !destLat || !destLng) {
    sendSuccess(res, 'ETA', { minutes: 30 }); // fallback
    return;
  }
  
  const eta = await DeliveryService.calculateETA(
    Number(originLat), 
    Number(originLng), 
    Number(destLat), 
    Number(destLng)
  );
  
  sendSuccess(res, 'ETA calculated', { minutes: eta });
});
