import { app, safeStorage } from 'electron';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { readConfigFile, updateConfigFile } from '../config';

export interface EncryptedFileData {
  type: 'lockrnotes-encrypted';
  algorithm: string;
  version: string;
  originalExtension: string;
  encrypted: string;
  iv: string;
  authTag: string;
  salt: string;
  created: string;
}

class ManagedEncryptionService {
  private readonly algorithm = 'aes-256-gcm';

  private readonly keyLength = 32; // 256 bits

  private readonly ivLength = 16; // 128 bits

  private readonly saltLength = 32; // 256 bits

  private readonly iterations = 100000; // PBKDF2 iterations

  private readonly keyFileName = '.lockrnotes_key';

  private masterKey: Buffer | null = null;

  private generateMasterKey(): Buffer {
    return crypto.randomBytes(this.keyLength);
  }

  private async getKeyStorageType(): Promise<'system' | 'folder'> {
    try {
      const config = await readConfigFile();
      return (config?.keyStorageType as 'system' | 'folder') || 'system';
    } catch {
      return 'system';
    }
  }

  private async getKeyFilePath(): Promise<string> {
    const storageType = await this.getKeyStorageType();

    if (storageType === 'folder') {
      // Use the defaultPath from config
      try {
        const config = await readConfigFile();
        if (config?.defaultPath) {
          const keyDir = path.join(config.defaultPath, '.lockrnotes');
          return path.join(keyDir, this.keyFileName);
        }
      } catch (err) {
        console.warn(
          'Failed to read config for folder storage, falling back to system',
          err,
        );
      }
    }

    // Default: use userData path
    const userDataPath = app.getPath('userData');
    const keyDir = path.join(userDataPath, 'encryption');
    return path.join(keyDir, this.keyFileName);
  }

  private async storeMasterKey(key: Buffer): Promise<void> {
    try {
      const keyFilePath = await this.getKeyFilePath();
      const keyDir = path.dirname(keyFilePath);
      await fs.mkdir(keyDir, { recursive: true });

      if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('System encryption is not available');
      }

      console.log('Storing master key to:', keyFilePath);
      const encryptedKey = safeStorage.encryptString(key.toString('base64'));
      console.log('Key encrypted successfully');

      const keyData = {
        type: 'lockrnotes-master-key',
        version: '1.0',
        encrypted: encryptedKey.toString('base64'),
        created: new Date().toISOString(),
      };

      await fs.writeFile(keyFilePath, JSON.stringify(keyData, null, 2));
      console.log('Master key file written successfully');
      // Master key stored securely in configured location
    } catch (error) {
      console.error('Failed to store master key:', error);
      throw new Error('Could not store encryption key');
    }
  }

  private async retrieveMasterKey(): Promise<Buffer | null> {
    try {
      const keyFilePath = await this.getKeyFilePath();
      console.log('Retrieving master key from:', keyFilePath);

      const keyDataStr = await fs.readFile(keyFilePath, 'utf8');
      const keyData = JSON.parse(keyDataStr);

      if (
        keyData.type !== 'lockrnotes-master-key' ||
        keyData.version !== '1.0'
      ) {
        throw new Error('Invalid master key file format');
      }

      if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('System encryption is not available');
      }

      const encryptedBuffer = Buffer.from(keyData.encrypted, 'base64');
      console.log('Attempting to decrypt master key');
      const decrypted = safeStorage.decryptString(encryptedBuffer);
      console.log('Master key decrypted successfully');
      return Buffer.from(decrypted, 'base64');
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Master key file not found, will generate new one
        console.log('Master key file not found - will generate new one');
        return null;
      }
      console.error('Failed to retrieve master key:', error);
      throw new Error('Could not load encryption key');
    }
  }

  private async getMasterKey(): Promise<Buffer> {
    if (this.masterKey) return this.masterKey;

    try {
      this.masterKey = await this.retrieveMasterKey();
      if (!this.masterKey) {
        this.masterKey = this.generateMasterKey();
        await this.storeMasterKey(this.masterKey);
        // New master key generated and stored
      } else {
        // Master key loaded from system keychain
      }
      return this.masterKey;
    } catch (error) {
      console.error('Master key management failed:', error);
      throw new Error('Encryption system initialization failed');
    }
  }

  private deriveFileKey(
    masterKey: Buffer,
    _filePath: string, // mantido para compatibilidade de assinatura
    salt: Buffer,
  ): Buffer {
    // Deriva a chave apenas do masterKey e salt, sem path
    return crypto.pbkdf2Sync(
      masterKey,
      salt,
      this.iterations,
      this.keyLength,
      'sha256',
    );
  }

  async encryptContent(
    content: string,
    filePath: string,
    originalExtension: string,
  ): Promise<EncryptedFileData> {
    const masterKey = await this.getMasterKey();
    const salt = crypto.randomBytes(this.saltLength);
    const iv = crypto.randomBytes(this.ivLength);

    const fileKey = this.deriveFileKey(masterKey, '', salt);

    const cipher = crypto.createCipheriv(this.algorithm, fileKey, iv);
    let encrypted = cipher.update(content, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();

    const result: EncryptedFileData = {
      type: 'lockrnotes-encrypted',
      algorithm: this.algorithm,
      version: '1.0',
      originalExtension,
      encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      salt: salt.toString('base64'),
      created: new Date().toISOString(),
    };

    // Encryption successful
    return result;
  }

  async decryptContent(
    encryptedData: EncryptedFileData,
    filePath: string,
  ): Promise<string> {
    if (
      encryptedData.type !== 'lockrnotes-encrypted' ||
      encryptedData.algorithm !== this.algorithm
    ) {
      console.error('Invalid encrypted file format');
      throw new Error('Invalid encrypted file format');
    }

    const masterKey = await this.getMasterKey();
    const salt = Buffer.from(encryptedData.salt, 'base64');
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const authTag = Buffer.from(encryptedData.authTag, 'base64');

    try {
      const fileKey = this.deriveFileKey(masterKey, '', salt);
      const decipher = crypto.createDecipheriv(this.algorithm, fileKey, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(
        encryptedData.encrypted,
        'base64',
        'utf8',
      );
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error: any) {
      throw new Error(
        `Failed to decrypt content: ${error?.message || 'unknown error'}`,
      );
    }
  }

  isContentEncrypted(content: string): boolean {
    try {
      const parsed = JSON.parse(content);
      return (
        parsed.type === 'lockrnotes-encrypted' &&
        parsed.algorithm === this.algorithm
      );
    } catch {
      return false;
    }
  }

  getOriginalExtension(content: string): string | null {
    try {
      const parsed = JSON.parse(content);
      if (parsed.type === 'lockrnotes-encrypted') {
        return parsed.originalExtension || null;
      }
    } catch {
      // Not a valid encrypted file
    }
    return null;
  }

  async resetEncryption(): Promise<void> {
    try {
      const keyFilePath = await this.getKeyFilePath();
      await fs.unlink(keyFilePath);
      this.masterKey = null;
      console.log(
        'Encryption system reset - new key will be generated on next use',
      );
    } catch (error) {
      console.warn('Could not delete master key file:', error);
    }
  }

  async migrateKeyStorage(newStorageType: string): Promise<void> {
    if (newStorageType !== 'system' && newStorageType !== 'folder') {
      throw new Error('Invalid storage type');
    }

    try {
      // Get the current storage type
      const currentStorageType = await this.getKeyStorageType();
      console.log(
        'Migrating encryption key from',
        currentStorageType,
        'to',
        newStorageType,
      );

      // If same type, nothing to do
      if (currentStorageType === newStorageType) {
        console.log('Storage type is already set to', newStorageType);
        return;
      }

      // Get the master key from current location BEFORE changing config
      console.log('Reading master key from current location...');
      const masterKey = await this.getMasterKey();
      if (!masterKey) {
        throw new Error('No master key found to migrate');
      }
      console.log('Master key loaded successfully');

      // Update the config to new storage type
      console.log('Updating config to use', newStorageType);
      await updateConfigFile({ keyStorageType: newStorageType });

      // Reset the cached master key so it will be treated as not yet stored
      this.masterKey = null;

      // Now store the same master key in the new location
      console.log('Storing master key in new location...');
      await this.storeMasterKey(masterKey);

      // Delete the old key file
      if (currentStorageType === 'folder' && newStorageType === 'system') {
        try {
          const config = await readConfigFile();
          if (config?.defaultPath) {
            const oldKeyDir = path.join(config.defaultPath, '.lockrnotes');
            console.log('Deleting old key directory:', oldKeyDir);
            // Remove the .lockrnotes directory
            await fs.rm(oldKeyDir, { recursive: true, force: true });
            console.log('Deleted local key directory:', oldKeyDir);
          }
        } catch (deleteErr) {
          console.warn('Could not delete local key directory:', deleteErr);
          // Don't throw - migration still succeeded
        }
      } else if (
        currentStorageType === 'system' &&
        newStorageType === 'folder'
      ) {
        // When migrating from system to folder, the system key will be left behind
        // but that's okay - it won't be used anymore
        console.log('Migrated from system to folder storage');
      }

      console.log(
        'Key storage migration completed from',
        currentStorageType,
        'to',
        newStorageType,
      );
    } catch (error) {
      console.error('Error migrating key storage:', error);
      throw new Error(`Failed to migrate key storage: ${String(error)}`);
    }
  }
}

export const managedEncryptionService = new ManagedEncryptionService();
