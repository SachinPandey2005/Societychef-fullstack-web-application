/**
 * Data Models & Local Schema Validator Schemas.
 * In Phase 2, this can hold Zod schemas or DB classes.
 */
export const schemas = {
  partnerValidation: {
    validatePhone: (phone: string) => /^\+?[1-9]\d{1,14}$/.test(phone),
  },
};
export default schemas;
