import * as crypto from 'crypto';

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
  private readonly algorithm = 'aes-256-gcm';

  private readonly keyLength = 32; // 256 bits

  private readonly ivLength = 16; // 128 bits

  private readonly saltLength = 32; // 256 bits

  private readonly iterations = 100000; // PBKDF2 iterations

  private deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      password,
      salt,
      this.iterations,
      this.keyLength,
      'sha256',
    );
  }

  async encryptContent(
    content: string,
    password: string,
    originalExtension: string,
  ): Promise<ManualEncryptedFileData> {
    const salt = crypto.randomBytes(this.saltLength);
    const iv = crypto.randomBytes(this.ivLength);

    const key = this.deriveKey(password, salt);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(content, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();

    const result: ManualEncryptedFileData = {
      type: 'lockrnotes-manual-encrypted',
      algorithm: this.algorithm,
      version: '1.0',
      originalExtension,
      encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      salt: salt.toString('base64'),
      created: new Date().toISOString(),
    };

    return result;
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

    const salt = Buffer.from(encryptedData.salt, 'base64');
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const authTag = Buffer.from(encryptedData.authTag, 'base64');

    const key = this.deriveKey(password, salt);

    try {
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(
        encryptedData.encrypted,
        'base64',
        'utf8',
      );
      decrypted += decipher.final('utf8');
      return decrypted;
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
