/**
 * Field Validation Utilities for Delivery App
 * Enforces Indian standard formats for Vehicle Registration Plate Numbers and Bank Account Details
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates Indian Vehicle Registration Plate Number (e.g., MH02CB1234, DL10AB1234, KA01EA9999)
 */
export function validateVehiclePlateNumber(plateNumber: string): ValidationResult {
  if (!plateNumber || !plateNumber.trim()) {
    return { isValid: false, error: 'Vehicle plate number is required.' };
  }

  const cleaned = plateNumber.replace(/[\s-]/g, '').toUpperCase();

  if (cleaned.length < 6 || cleaned.length > 12) {
    return { isValid: false, error: 'Plate number must be 6 to 12 alphanumeric characters.' };
  }

  // Standard Indian Vehicle Reg Format: State (2 letters) + District (1-2 digits) + Series (1-3 letters) + Number (4 digits)
  const indianPlateRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;
  // Fallback flexible alphanumeric check
  const generalAlphanumericRegex = /^[A-Z0-9]{6,12}$/;

  if (!indianPlateRegex.test(cleaned) && !generalAlphanumericRegex.test(cleaned)) {
    return { isValid: false, error: 'Invalid plate format (e.g. MH02CB1234 or DL10AB1234).' };
  }

  return { isValid: true };
}

/**
 * Validates Bank Account Holder Name
 */
export function validateAccountHolderName(name: string): ValidationResult {
  if (!name || !name.trim()) {
    return { isValid: false, error: 'Account holder name is required.' };
  }

  const cleaned = name.trim();
  if (cleaned.length < 2) {
    return { isValid: false, error: 'Account holder name must be at least 2 characters.' };
  }

  const nameRegex = /^[a-zA-Z\s.-]+$/;
  if (!nameRegex.test(cleaned)) {
    return { isValid: false, error: 'Name must contain only letters, dots, and spaces.' };
  }

  return { isValid: true };
}

/**
 * Validates Bank Name
 */
export function validateBankName(bankName: string): ValidationResult {
  if (!bankName || !bankName.trim()) {
    return { isValid: false, error: 'Bank name is required.' };
  }

  if (bankName.trim().length < 2) {
    return { isValid: false, error: 'Bank name must be at least 2 characters.' };
  }

  return { isValid: true };
}

/**
 * Validates Bank Account Number (Indian Banks: 9 to 18 digits)
 */
export function validateAccountNumber(accountNumber: string): ValidationResult {
  if (!accountNumber || !accountNumber.trim()) {
    return { isValid: false, error: 'Account number is required.' };
  }

  const cleaned = accountNumber.replace(/\s/g, '');

  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, error: 'Account number must contain only numbers.' };
  }

  if (cleaned.length < 9 || cleaned.length > 18) {
    return { isValid: false, error: 'Account number must be 9 to 18 digits long.' };
  }

  return { isValid: true };
}

/**
 * Validates Indian Financial System Code (IFSC) Code
 * Format: 11 characters - 4 letters, 5th char '0', 6 alphanumeric characters (e.g. HDFC0001234)
 */
export function validateIfscCode(ifsc: string): ValidationResult {
  if (!ifsc || !ifsc.trim()) {
    return { isValid: false, error: 'IFSC code is required.' };
  }

  const cleaned = ifsc.trim().toUpperCase();

  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(cleaned)) {
    return { isValid: false, error: 'Invalid IFSC code format (11 chars e.g. HDFC0001234).' };
  }

  return { isValid: true };
}

/**
 * Validates UPI ID (e.g. rider@okhdfcbank or 9876543210@ybl)
 */
export function validateUpiId(upiId?: string): ValidationResult {
  if (!upiId || !upiId.trim()) {
    return { isValid: true }; // Optional field
  }

  const cleaned = upiId.trim().toLowerCase();
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

  if (!upiRegex.test(cleaned)) {
    return { isValid: false, error: 'Invalid UPI ID format (e.g. rider@okhdfcbank).' };
  }

  return { isValid: true };
}
