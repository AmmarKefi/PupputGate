import crypto from 'node:crypto';
import { env } from '../env';

/**
 * Opaque bearer tokens. The raw token is random (never derived from user data)
 * and is returned to the client once. We store only a keyed hash of it, so a
 * database read cannot recover a usable token. Tokens expire.
 */
export function generateRawToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashToken(raw: string): string {
  return crypto
    .createHmac('sha256', env.tokenSecret)
    .update(raw)
    .digest('hex');
}

export function tokenExpiry(): Date {
  return new Date(Date.now() + env.tokenTtlDays * 24 * 60 * 60 * 1000);
}
