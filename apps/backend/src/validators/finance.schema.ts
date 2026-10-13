import { z } from 'zod';

export const topupWalletSchema = z.object({
  body: z.object({
    amount: z.number().int().positive(),
  })
});

// bank_details is deliberately NOT accepted here. It used to be taken directly
// from the request body and stored as-is, which meant any authenticated chef
// client could submit arbitrary bank details on a payout request — including
// someone else's account — and have it recorded as where the money should go.
// The payout amount is the only thing a chef can request; requestPayout()
// looks up their own saved, previously-verified bank account from their
// kitchen profile server-side and ignores anything the client sends for it.
export const requestPayoutSchema = z.object({
  body: z.object({
    amount: z.number().int().positive(),
  })
});

export const updatePayoutStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED']),
    reference_id: z.string().optional(),
  })
});
