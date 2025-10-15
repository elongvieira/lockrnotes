import { app, safeStorage } from 'electron';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

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
  private readonly keyFileName = 'master.lockr';

  private masterKey: Buffer | null = null;

  /**
   * Gera uma chave aleatória de 256 bits
   */
  private generateMasterKey(): Buffer {
    // Gera chave completamente aleatória de 256 bits
    return crypto.randomBytes(this.keyLength);
  }

  /**
   * Obtém o caminho para o arquivo da chave
   */
  private getKeyFilePath(): string {
    const userDataPath = app.getPath('userData');
    const keyDir = path.join(userDataPath, 'encryption');
    return path.join(keyDir, this.keyFileName);
  }

  /**
   * Armazena a master key usando safeStorage do Electron
   */
  private async storeMasterKey(key: Buffer): Promise<void> {
    try {
      const keyFilePath = this.getKeyFilePath();
      const keyDir = path.dirname(keyFilePath);

      // Cria diretório se não existir
      await fs.mkdir(keyDir, { recursive: true });

      // Verifica se safeStorage está disponível
      if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('System encryption is not available');
      }

      // Usa safeStorage para criptografar a chave
      // safeStorage usa automaticamente:
      // - Windows: DPAPI (Data Protection API)
      // - macOS: Keychain
      // - Linux: Secret Service API (libsecret)
      const encryptedKey = safeStorage.encryptString(key.toString('base64'));

      // Estrutura do arquivo da chave
      const keyData = {
        type: 'lockrnotes-master-key',
        version: '1.0',
        encrypted: encryptedKey.toString('base64'),
        created: new Date().toISOString(),
      };

      await fs.writeFile(keyFilePath, JSON.stringify(keyData, null, 2));
      console.log('Master key stored securely using system keychain');
    } catch (error) {
      console.error('Failed to store master key:', error);
      throw new Error('Could not store encryption key');
    }
  }

  /**
   * Recupera a master key usando safeStorage do Electron
   */
  private async retrieveMasterKey(): Promise<Buffer | null> {
    try {
      const keyFilePath = this.getKeyFilePath();
      const keyDataStr = await fs.readFile(keyFilePath, 'utf8');
      const keyData = JSON.parse(keyDataStr);

      // Valida estrutura do arquivo
      if (
        keyData.type !== 'lockrnotes-master-key' ||
        keyData.version !== '2.0'
      ) {
        throw new Error('Invalid master key file format');
      }

      // Verifica se safeStorage está disponível
      if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('System encryption is not available');
      }

      // Descriptografa usando safeStorage
      const encryptedBuffer = Buffer.from(keyData.encrypted, 'base64');
      const decrypted = safeStorage.decryptString(encryptedBuffer);

      return Buffer.from(decrypted, 'base64');
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log('Master key file not found, will generate new one');
        return null;
      }
      console.error('Failed to retrieve master key:', error);
      throw new Error('Could not load encryption key');
    }
  }

  /**
   * Obtém ou gera a master key
   */
  private async getMasterKey(): Promise<Buffer> {
    if (this.masterKey) {
      return this.masterKey;
    }

    try {
      // Tenta recuperar chave existente
      this.masterKey = await this.retrieveMasterKey();

      if (!this.masterKey) {
        // Se não existe, gera nova chave aleatória
        this.masterKey = this.generateMasterKey();
        await this.storeMasterKey(this.masterKey);
        console.log('New master key generated and stored in system keychain');
      } else {
        console.log('Master key loaded from system keychain');
      }

      return this.masterKey;
    } catch (error) {
      console.error('Master key management failed:', error);
      throw new Error('Encryption system initialization failed');
    }
  }

  /**
   * Deriva chave específica para um arquivo
   */
  private deriveFileKey(
    masterKey: Buffer,
    filePath: string,
    salt: Buffer,
  ): Buffer {
    const fileIdentifier = `${filePath}`;

    return crypto.pbkdf2Sync(
      Buffer.concat([masterKey, Buffer.from(fileIdentifier)]),
      salt,
      this.iterations,
      this.keyLength,
      'sha256',
    );
  }

  /**
   * Criptografa conteúdo de arquivo
   */
  async encryptContent(
    content: string,
    filePath: string,
    originalExtension: string,
  ): Promise<EncryptedFileData> {
    try {
      const masterKey = await this.getMasterKey();
      const salt = crypto.randomBytes(this.saltLength);
      const iv = crypto.randomBytes(this.ivLength);

      // Deriva chave específica para este arquivo
      const fileKey = this.deriveFileKey(masterKey, filePath, salt);

      // Criptografa o conteúdo
      const cipher = crypto.createCipheriv(this.algorithm, fileKey, iv);

      let encrypted = cipher.update(content, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      const authTag = cipher.getAuthTag();

      return {
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
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt content');
    }
  }

  /**
   * Descriptografa conteúdo de arquivo
   */
  async decryptContent(
    encryptedData: EncryptedFileData,
    filePath: string,
  ): Promise<string> {
    try {
      // Valida estrutura
      if (
        encryptedData.type !== 'lockrnotes-encrypted' ||
        encryptedData.algorithm !== this.algorithm
      ) {
        throw new Error('Invalid encrypted file format');
      }

      const masterKey = await this.getMasterKey();
      const salt = Buffer.from(encryptedData.salt, 'base64');

      // Deriva a mesma chave usada na criptografia
      const fileKey = this.deriveFileKey(masterKey, filePath, salt);

      const iv = Buffer.from(encryptedData.iv, 'base64');
      const authTag = Buffer.from(encryptedData.authTag, 'base64');

      // Descriptografa
      const decipher = crypto.createDecipheriv(this.algorithm, fileKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(
        encryptedData.encrypted,
        'base64',
        'utf8',
      );
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt content - file may be corrupted');
    }
  }

  /**
   * Verifica se conteúdo está criptografado
   */
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

  /**
   * Obtém extensão original de um arquivo criptografado
   */
  getOriginalExtension(content: string): string | null {
    try {
      const parsed = JSON.parse(content);
      if (parsed.type === 'lockrnotes-encrypted') {
        return parsed.originalExtension || null;
      }
    } catch {
      // Não é um arquivo criptografado válido
    }
    return null;
  }

  /**
   * Reseta o sistema de criptografia (gera nova chave)
   */
  async resetEncryption(): Promise<void> {
    try {
      const keyFilePath = this.getKeyFilePath();
      await fs.unlink(keyFilePath);
      this.masterKey = null;
      console.log(
        'Encryption system reset - new key will be generated on next use',
      );
    } catch (error) {
      console.warn('Could not delete master key file:', error);
    }
  }
}

// Export singleton instance
export const managedEncryptionService = new ManagedEncryptionService();
