import { contextBridge, ipcRenderer } from 'electron';
import type { EncryptedFileData } from '../services/managedEncryptionService';

export interface EncryptionAPI {
  encryptContent: (
    content: string,
    filePath: string,
    originalExtension: string,
  ) => Promise<EncryptedFileData>;
  decryptContent: (
    encryptedData: EncryptedFileData,
    filePath: string,
  ) => Promise<string>;
  isContentEncrypted: (content: string) => Promise<boolean>;
  getOriginalExtension: (content: string) => Promise<string | null>;
  resetEncryption: () => Promise<void>;
  migrateKeyStorage: (
    newStorageType: string,
    defaultPath?: string,
  ) => Promise<void>;
}

const encryptionApi: EncryptionAPI = {
  async encryptContent(
    content: string,
    filePath: string,
    originalExtension: string,
  ): Promise<EncryptedFileData> {
    const result = await ipcRenderer.invoke(
      'encryption:encrypt',
      content,
      filePath,
      originalExtension,
    );
    if (!result.success) {
      throw new Error(result.error || 'Encryption failed');
    }
    return result.data;
  },

  async decryptContent(
    encryptedData: EncryptedFileData,
    filePath: string,
  ): Promise<string> {
    const result = await ipcRenderer.invoke(
      'encryption:decrypt',
      encryptedData,
      filePath,
    );
    if (!result.success) {
      throw new Error(result.error || 'Decryption failed');
    }
    return result.data;
  },

  async isContentEncrypted(content: string): Promise<boolean> {
    const result = await ipcRenderer.invoke('encryption:isEncrypted', content);
    if (!result.success) {
      throw new Error(result.error || 'Failed to check encryption status');
    }
    return result.data;
  },

  async getOriginalExtension(content: string): Promise<string | null> {
    const result = await ipcRenderer.invoke(
      'encryption:getOriginalExtension',
      content,
    );
    if (!result.success) {
      throw new Error(result.error || 'Failed to get original extension');
    }
    return result.data;
  },

  async resetEncryption(): Promise<void> {
    const result = await ipcRenderer.invoke('encryption:reset');
    if (!result.success) {
      throw new Error(result.error || 'Failed to reset encryption');
    }
  },

  async migrateKeyStorage(
    newStorageType: string,
    defaultPath?: string,
  ): Promise<void> {
    const result = await ipcRenderer.invoke(
      'encryption:migrateKeyStorage',
      newStorageType,
      defaultPath,
    );
    if (!result.success) {
      throw new Error(result.error || 'Failed to migrate key storage');
    }
  },
};

// Registra a API no contexto global
contextBridge.exposeInMainWorld('encryptionAPI', encryptionApi);
