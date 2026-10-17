import crypto from 'crypto';

export const FILE_CIPHER = 'aes-256-gcm';
export const LEGACY_FILE_VERSION = '1.0';
export const CURRENT_FILE_VERSION = '2.0';

const LEGACY_ITERATIONS = 100_000;
const CURRENT_ITERATIONS = 600_000;
const KEY_LENGTH = 32;
const CURRENT_IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export interface CipherParts {
  version?: string;
  originalExtension: string;
  encrypted: string;
  iv: string;
  authTag: string;
  salt: string;
}

function iterationsFor(version: string): number {
  return version === CURRENT_FILE_VERSION
    ? CURRENT_ITERATIONS
    : LEGACY_ITERATIONS;
}

function associatedData(
  version: string,
  originalExtension: string,
): Buffer | null {
  if (version !== CURRENT_FILE_VERSION) return null;
  return Buffer.from(`${version}:${originalExtension}`, 'utf8');
}

export function pbkdf2Key(
  secret: Buffer | string,
  salt: Buffer,
  version: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      secret,
      salt,
      iterationsFor(version),
      KEY_LENGTH,
      'sha256',
      (error, key) => {
        if (error) reject(error);
        else resolve(key);
      },
    );
  });
}

/** New files stretch a random master key with HKDF. Version 1.0 keeps PBKDF2. */
export async function managedFileKey(
  masterKey: Buffer,
  salt: Buffer,
  version: string,
): Promise<Buffer> {
  if (version === CURRENT_FILE_VERSION) {
    return Buffer.from(
      crypto.hkdfSync('sha256', masterKey, salt, 'lockrnotes-file', KEY_LENGTH),
    );
  }
  return pbkdf2Key(masterKey, salt, version);
}

export function seal(
  key: Buffer,
  plaintext: string,
  version: string,
  originalExtension: string,
): { encrypted: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(
    version === CURRENT_FILE_VERSION ? CURRENT_IV_LENGTH : 16,
  );
  const cipher = crypto.createCipheriv(FILE_CIPHER, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const extra = associatedData(version, originalExtension);
  if (extra) cipher.setAAD(extra);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]).toString('base64');
  return {
    encrypted,
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  };
}

export function open(key: Buffer, parts: CipherParts): string {
  const version = parts.version || LEGACY_FILE_VERSION;
  const iv = Buffer.from(parts.iv, 'base64');
  const authTag = Buffer.from(parts.authTag, 'base64');
  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid authentication tag');
  }
  const decipher = crypto.createDecipheriv(FILE_CIPHER, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);
  const extra = associatedData(version, parts.originalExtension);
  if (extra) decipher.setAAD(extra);
  return Buffer.concat([
    decipher.update(Buffer.from(parts.encrypted, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
