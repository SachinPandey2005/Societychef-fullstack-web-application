import { z } from 'zod';

export const updatePartnerProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    gender: z.string().optional(),
    date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD').or(z.literal('')).optional(),
    email: z.string().email('Please enter a valid email address').or(z.literal('')).optional(),
    blood_group: z.string().optional(),
    preferred_language: z.string().optional(),
    profile_photo_url: z.string().url().or(z.literal('')).optional(),
    permanent_address: z.string().or(z.literal('')).optional(),
    current_address: z.string().or(z.literal('')).optional(),
    city: z.string().or(z.literal('')).optional(),
    state: z.string().or(z.literal('')).optional(),
    pincode: z.string().regex(/^\d{6}$/, 'Must be a 6-digit PIN code').or(z.literal('')).optional(),
    landmark: z.string().optional(),
    primary_name: z.string().or(z.literal('')).optional(),
    primary_phone: z.string().regex(/^(?:\+91|0)?\d{10}$/, 'Must be a valid 10-digit phone number').or(z.literal('')).optional(),
    primary_relationship: z.string().optional(),
    secondary_name: z.string().optional(),
    secondary_phone: z.string().optional(),
    secondary_relationship: z.string().optional(),
  })
});

export const uploadDocumentSchema = z.object({
  body: z.object({
    document_type: z.enum(['aadhaar_front', 'aadhaar_back', 'pan_card', 'license_front', 'license_back', 'passport', 'selfie']),
    document_url: z.string().url(),
    expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be YYYY-MM-DD').or(z.literal('')).optional(),
  })
});

export const updateVehicleSchema = z.object({
  body: z.object({
    vehicle_type: z.enum(['BIKE', 'SCOOTER', 'CYCLE', 'EV', 'WALKING']),
    vehicle_number: z.string().min(5),
    rc_url: z.string().url().or(z.literal('')).optional(),
    insurance_url: z.string().url().or(z.literal('')).optional(),
    puc_url: z.string().url().or(z.literal('')).optional(),
    photo_url: z.string().url().or(z.literal('')).optional(),
  })
});

export const updateBankSchema = z.object({
  body: z.object({
    holder_name: z.string().min(2),
    bank_name: z.string().min(2),
    account_number: z.string().min(8),
    ifsc_code: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Must be a valid 11-character Indian IFSC code'),
    upi_id: z.string().optional(),
    cheque_url: z.string().url().or(z.literal('')).optional(),
  })
});
