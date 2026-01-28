import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Encrypts sensitive data using AES-256-GCM
 * Used for medical data like diagnosis, allergies, chronic diseases
 */
export function encrypt(text: string, encryptionKey: string): string {
  const key = Buffer.from(encryptionKey.padEnd(32, '0').slice(0, 32));
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  // Format: iv:tag:encryptedData
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts data encrypted with the encrypt function
 */
export function decrypt(encryptedText: string, encryptionKey: string): string {
  const key = Buffer.from(encryptionKey.padEnd(32, '0').slice(0, 32));
  const parts = encryptedText.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const tag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encrypts a JSON object
 */
export function encryptJson(data: object, encryptionKey: string): string {
  return encrypt(JSON.stringify(data), encryptionKey);
}

/**
 * Decrypts to a JSON object
 */
export function decryptJson<T>(
  encryptedText: string,
  encryptionKey: string,
): T {
  const decrypted = decrypt(encryptedText, encryptionKey);
  return JSON.parse(decrypted) as T;
}
