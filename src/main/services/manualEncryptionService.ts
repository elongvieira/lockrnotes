import * as crypto from 'crypto';
import {
  CURRENT_FILE_VERSION,
  FILE_CIPHER,
  open,
  pbkdf2Key,
  seal,
} from './fileCipher';

export interface ManualEncryptedFileData {
  type: 'lockrnotes-manual-encrypted';
  algorithm: string;
  version: string;
  originalExtension: string;
  encrypted: string;
  iv: string;
  authTag: string;
  salt: string;
  created: string;
}

class ManualEncryptionService {
  private readonly algorithm = FILE_CIPHER;

  private readonly saltLength = 32;

  async encryptContent(
    content: string,
    password: string,
    originalExtension: string,
  ): Promise<ManualEncryptedFileData> {
    const salt = crypto.randomBytes(this.saltLength);
    const key = await pbkdf2Key(password, salt, CURRENT_FILE_VERSION);
    const sealed = seal(key, content, CURRENT_FILE_VERSION, originalExtension);

    return {
      type: 'lockrnotes-manual-encrypted',
      algorithm: this.algorithm,
      version: CURRENT_FILE_VERSION,
      originalExtension,
      salt: salt.toString('base64'),
      created: new Date().toISOString(),
      ...sealed,
    };
  }

  async decryptContent(
    encryptedData: ManualEncryptedFileData,
    password: string,
  ): Promise<string> {
    if (
      encryptedData.type !== 'lockrnotes-manual-encrypted' ||
      encryptedData.algorithm !== this.algorithm
    ) {
      throw new Error('Invalid encrypted file format');
    }

    const version = encryptedData.version || '1.0';
    const salt = Buffer.from(encryptedData.salt, 'base64');
    const key = await pbkdf2Key(password, salt, version);

    try {
      return open(key, encryptedData);
    } catch {
      throw new Error('Failed to decrypt - wrong password or corrupted file');
    }
  }

  isContentManuallyEncrypted(content: string): boolean {
    try {
      const parsed = JSON.parse(content);
      return (
        parsed.type === 'lockrnotes-manual-encrypted' &&
        parsed.algorithm === this.algorithm
      );
    } catch {
      return false;
    }
  }

  getOriginalExtension(content: string): string | null {
    try {
      const parsed = JSON.parse(content);
      if (parsed.type === 'lockrnotes-manual-encrypted') {
        return parsed.originalExtension || null;
      }
    } catch {
      // Not a valid encrypted file
    }
    return null;
  }
}

export const manualEncryptionService = new ManualEncryptionService();
