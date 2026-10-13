import { z } from 'zod';

export const registerPartnerSchema = z.object({
  body: z.object({
    vehicle_details: z.string().min(2),
    license_number: z.string().min(5),
  })
});

export const updatePartnerStatusSchema = z.object({
  body: z.object({
    is_online: z.boolean(),
  })
});

export const updateDeliveryStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum([
      'ACCEPTED', 'REJECTED', 'AT_PICKUP', 'PICKED_UP', 
      'OUT_FOR_DELIVERY', 'REACHED_CUSTOMER', 'DELIVERED', 'FAILED'
    ]),
    otp: z.string().length(6).optional(), // Required for PICKED_UP and DELIVERED
  })
});

export const pushTrackingSchema = z.object({
  params: z.object({
    id: z.string().uuid(), // assignment_id
  }),
  body: z.object({
    lat: z.number(),
    lng: z.number(),
  })
});
