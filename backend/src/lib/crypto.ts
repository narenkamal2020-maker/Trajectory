/**
 * Application-level field encryption (AES-256-GCM) for sensitive free text such as resumes.
 * Values are stored as `enc:v1:<iv>:<tag>:<ciphertext>` (base64). Unprefixed values are treated as
 * legacy plaintext, so existing rows stay readable until `npm run data:encrypt` converts them.
 */
import crypto from 'crypto';
import { env } from '../config/env';

const PREFIX = 'enc:v1:';
let cachedKey: Buffer | null | undefined;

function key(): Buffer | null {
  if (cachedKey !== undefined) return cachedKey;
  const raw = env.DATA_ENCRYPTION_KEY;
  if (!raw) return (cachedKey = null);
  const buf = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (buf.length !== 32) throw new Error('DATA_ENCRYPTION_KEY must be 32 bytes (64 hex chars or base64)');
  return (cachedKey = buf);
}

export const encryptionEnabled = () => key() !== null;

export function encryptField(plain: string | null | undefined): string | null {
  if (plain === null || plain === undefined) return null;
  const k = key();
  if (!k) return plain; // development without a key: stored as plaintext (production refuses to start)
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', k, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return `${PREFIX}${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${ct.toString('base64')}`;
}

export function decryptField(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (!value.startsWith(PREFIX)) return value; // legacy plaintext
  const k = key();
  if (!k) throw new Error('Encrypted data found but DATA_ENCRYPTION_KEY is not configured');
  const [ivB64, tagB64, ctB64] = value.slice(PREFIX.length).split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', k, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()]).toString('utf8');
}

export const isEncrypted = (v: unknown) => typeof v === 'string' && v.startsWith(PREFIX);
