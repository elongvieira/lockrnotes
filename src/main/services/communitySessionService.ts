import { app, safeStorage } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

const SESSION_FILE_NAME = '.community_session';

export interface CommunitySession {
  host: string;
  port: number;
  email: string;
  accessToken: string;
  isAdmin: boolean;
}

export function getSessionFilePath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'community', SESSION_FILE_NAME);
}

export async function saveSession(session: CommunitySession): Promise<void> {
  const filePath = getSessionFilePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('System encryption is not available');
  }

  const encrypted = safeStorage.encryptString(JSON.stringify(session));
  const wrapper = {
    type: 'lockrnotes-community-session',
    version: '1.0',
    encrypted: encrypted.toString('base64'),
    created: new Date().toISOString(),
  };

  await fs.writeFile(filePath, JSON.stringify(wrapper, null, 2), 'utf8');
}

export async function loadSession(): Promise<CommunitySession | null> {
  const filePath = getSessionFilePath();

  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const wrapper = JSON.parse(raw);

    if (
      wrapper.type !== 'lockrnotes-community-session' ||
      wrapper.version !== '1.0'
    ) {
      return null;
    }

    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('System encryption is not available');
    }

    const buffer = Buffer.from(wrapper.encrypted, 'base64');
    const decrypted = safeStorage.decryptString(buffer);
    const parsed = JSON.parse(decrypted);
    // backward-compat: sessions stored before isAdmin was added
    return { isAdmin: false, ...parsed };
  } catch (err: any) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

export async function deleteSession(): Promise<void> {
  const filePath = getSessionFilePath();
  try {
    await fs.unlink(filePath);
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err;
  }
}

/** Decode the payload section of a JWT (not cryptographically verified). */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return {};
    const buf = Buffer.from(parts[1], 'base64url');
    return JSON.parse(buf.toString('utf8'));
  } catch {
    return {};
  }
}

/**
 * Determine whether the JWT belongs to an admin user.
 * Supports common NestJS role conventions:
 *   - roles: ['admin']
 *   - role: 'admin'
 *   - isAdmin: true
 */
export function extractIsAdmin(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (Array.isArray(payload.roles)) {
    return (payload.roles as string[]).includes('admin');
  }
  if (typeof payload.role === 'string') return payload.role === 'admin';
  if (typeof payload.isAdmin === 'boolean') return payload.isAdmin;
  return false;
}
