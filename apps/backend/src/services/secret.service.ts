import { env } from '../config/env';

/**
 * SecretService
 * Centralizes secret retrieval. Currently wraps `process.env` (validated by Zod),
 * but designed to be easily swapped for AWS Secrets Manager, HashiCorp Vault, etc.
 */
export class SecretService {
  /**
   * Get a secret by key.
   */
  static get(key: keyof typeof env): any {
    return env[key];
  }

  /**
   * Get a required secret, throwing if missing (though Zod in env.ts already guarantees presence).
   */
  static getRequired(key: keyof typeof env): any {
    const value = env[key];
    if (!value) {
      throw new Error(`Secret ${key} is missing from environment.`);
    }
    return value;
  }
}
