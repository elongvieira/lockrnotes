import { app, safeStorage } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

const SESSION_FILE_NAME = '.vault_session';

export interface VaultSession {
  host: string;
  port: number;
  token: string;
  mountPath: string;
}

export function getVaultSessionFilePath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'vault', SESSION_FILE_NAME);
}

export async function saveVaultSession(session: VaultSession): Promise<void> {
  const filePath = getVaultSessionFilePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('System encryption is not available');
  }

  const encrypted = safeStorage.encryptString(JSON.stringify(session));
  const wrapper = {
    type: 'lockrnotes-vault-session',
    version: '1.0',
    encrypted: encrypted.toString('base64'),
    created: new Date().toISOString(),
  };

  await fs.writeFile(filePath, JSON.stringify(wrapper, null, 2), 'utf8');
}

export async function loadVaultSession(): Promise<VaultSession | null> {
  const filePath = getVaultSessionFilePath();

  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const wrapper = JSON.parse(raw);

    if (
      wrapper.type !== 'lockrnotes-vault-session' ||
      wrapper.version !== '1.0'
    ) {
      return null;
    }

    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('System encryption is not available');
    }

    const buffer = Buffer.from(wrapper.encrypted, 'base64');
    const decrypted = safeStorage.decryptString(buffer);
    return JSON.parse(decrypted);
  } catch (err: any) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

export async function deleteVaultSession(): Promise<void> {
  const filePath = getVaultSessionFilePath();
  try {
    await fs.unlink(filePath);
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err;
  }
}
