import { z } from 'zod';

export const createAdminNoteSchema = z.object({
  body: z.object({
    entity_type: z.enum(['CUSTOMER', 'CHEF', 'ORDER', 'PARTNER']),
    entity_id: z.string().uuid(),
    note: z.string().min(1).max(2000),
  })
});

export const updateCustomerStatusSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    status: z.enum(['ACTIVE', 'PENDING', 'SUSPENDED', 'active', 'pending', 'suspended']),
    reason: z.string().optional().default('Ops action'),
  })
});

export const updatePartnerStatusSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    status: z.enum(['ACTIVE', 'PENDING', 'SUSPENDED', 'active', 'pending', 'suspended']),
    reason: z.string().optional().default('Ops action'),
  })
});

export const assignPartnerSocietySchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    society_id: z.string(),
    tower_coverage: z.array(z.string()).default(['A', 'B', 'C']),
    delivery_radius_km: z.number().default(2.0),
    working_zone: z.string().default('Default Zone'),
    shift_timing_start: z.string().default('08:00'),
    shift_timing_end: z.string().default('20:00'),
  })
});

export const updatePartnerKycSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    kyc_status: z.enum(['APPROVED', 'REJECTED']),
    notes: z.string().optional(),
  })
});


export const searchSchema = z.object({
  query: z.object({
    query: z.string().optional(),
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('10').transform(Number),
    status: z.string().optional(),
  })
});
