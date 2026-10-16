import { app, safeStorage } from 'electron';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { readConfigFile, updateConfigFile } from '../config';
import { headerLooksManaged, resolveMasterKeyPath } from './masterKeyLocation';

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

  private masterKey: Buffer | null = null;

  private cachedKeyPath: string | null = null;

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
    let defaultPath: string | undefined;
    if (storageType === 'folder') {
      try {
        const config = await readConfigFile();
        defaultPath = config?.defaultPath;
      } catch (err) {
        console.warn(
          'Failed to read config for folder storage, falling back to system',
          err,
        );
      }
    }
    return resolveMasterKeyPath({
      storageType: defaultPath ? storageType : 'system',
      defaultPath,
      userDataPath: app.getPath('userData'),
    });
  }

  private async writeKeyFile(keyFilePath: string, key: Buffer): Promise<void> {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('System encryption is not available');
    }
    const keyDir = path.dirname(keyFilePath);
    await fs.mkdir(keyDir, { recursive: true });
    const encryptedKey = safeStorage.encryptString(key.toString('base64'));
    const keyData = {
      type: 'lockrnotes-master-key',
      version: '1.0',
      encrypted: encryptedKey.toString('base64'),
      created: new Date().toISOString(),
    };
    await fs.writeFile(keyFilePath, JSON.stringify(keyData, null, 2));
  }

  private async storeMasterKey(key: Buffer): Promise<void> {
    try {
      await this.writeKeyFile(await this.getKeyFilePath(), key);
    } catch (error) {
      console.error('Failed to store master key:', error);
      throw new Error('Could not store encryption key');
    }
  }

  private async retrieveMasterKey(): Promise<Buffer | null> {
    try {
      const keyFilePath = await this.getKeyFilePath();
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
      const decrypted = safeStorage.decryptString(encryptedBuffer);
      return Buffer.from(decrypted, 'base64');
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      console.error('Failed to retrieve master key:', error);
      throw new Error('Could not load encryption key');
    }
  }

  private async directoryHasManagedFiles(root: string): Promise<boolean> {
    let entries;
    try {
      entries = await fs.readdir(root, { withFileTypes: true });
    } catch {
      return false;
    }
    for (const entry of entries) {
      if (entry.name === '.lockrnotes') continue;
      const fullPath = path.join(root, entry.name);
      if (entry.isDirectory()) {
        if (await this.directoryHasManagedFiles(fullPath)) return true;
        continue;
      }
      const extension = path.extname(entry.name).toLowerCase();
      if (!['.ltxt', '.ljson', '.lenc'].includes(extension)) continue;
      try {
        const file = await fs.open(fullPath, 'r');
        const buffer = Buffer.alloc(512);
        await file.read(buffer, 0, buffer.length, 0);
        await file.close();
        if (headerLooksManaged(buffer.toString('utf8'))) return true;
      } catch {
        // unreadable file is not proof of a managed note
      }
    }
    return false;
  }

  private async getMasterKey(): Promise<Buffer> {
    const keyFilePath = await this.getKeyFilePath();
    if (this.masterKey && this.cachedKeyPath === keyFilePath) {
      return this.masterKey;
    }
    this.masterKey = null;
    this.cachedKeyPath = null;

    try {
      const existing = await this.retrieveMasterKey();
      if (existing) {
        this.masterKey = existing;
        this.cachedKeyPath = keyFilePath;
        return existing;
      }

      const config = await readConfigFile();
      if (
        config?.defaultPath &&
        (await this.directoryHasManagedFiles(config.defaultPath))
      ) {
        throw new Error(
          'Encryption key is missing. Refusing to create a new key while encrypted files exist.',
        );
      }

      this.masterKey = this.generateMasterKey();
      await this.storeMasterKey(this.masterKey);
      this.cachedKeyPath = keyFilePath;
      return this.masterKey;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith('Encryption key is missing')
      ) {
        throw error;
      }
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
    _filePath: string,
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
      this.cachedKeyPath = null;
    } catch (error) {
      console.warn('Could not delete master key file:', error);
    }
  }

  async migrateKeyStorage(
    newStorageType: string,
    nextDefaultPath?: string,
  ): Promise<void> {
    if (newStorageType !== 'system' && newStorageType !== 'folder') {
      throw new Error('Invalid storage type');
    }

    try {
      const currentStorageType = await this.getKeyStorageType();
      const config = await readConfigFile();
      const source = await this.getKeyFilePath();
      const destination = resolveMasterKeyPath({
        storageType: newStorageType,
        defaultPath: nextDefaultPath || config?.defaultPath,
        userDataPath: app.getPath('userData'),
      });
      const samePlace = path.resolve(source) === path.resolve(destination);
      if (samePlace && currentStorageType === newStorageType) {
        return;
      }

      const masterKey = await this.getMasterKey();
      if (!samePlace) {
        await this.writeKeyFile(destination, masterKey);
      }

      await updateConfigFile({
        keyStorageType: newStorageType,
        ...(nextDefaultPath ? { defaultPath: nextDefaultPath } : {}),
      });
      this.masterKey = masterKey;
      this.cachedKeyPath = destination;

      if (
        !samePlace &&
        currentStorageType === 'folder' &&
        newStorageType === 'system'
      ) {
        try {
          await fs.rm(path.dirname(source), { recursive: true, force: true });
        } catch (deleteErr) {
          console.warn('Could not delete local key directory:', deleteErr);
        }
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith('Encryption key is missing')
      ) {
        throw error;
      }
      console.error('Error migrating key storage:', error);
      throw new Error(`Failed to migrate key storage: ${String(error)}`);
    }
  }
}

export const managedEncryptionService = new ManagedEncryptionService();
