import crypto from 'crypto';
import { SecretService } from '../services/secret.service';

const ALGORITHM = 'aes-256-gcm';
// In a real scenario, use a specific encryption key from SecretService, e.g. ENCRYPTION_KEY
// We fallback to hashing the JWT_SECRET to derive a 32-byte key for demonstration purposes
const getEncryptionKey = () => crypto.createHash('sha256').update(String(SecretService.get('JWT_SECRET'))).digest();

export const encrypt = (text: string): { ciphertext: string; iv: string; authTag: string } => {
  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag
  };
};

export const decrypt = (ciphertext: string, ivHex: string, authTagHex: string): string => {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
