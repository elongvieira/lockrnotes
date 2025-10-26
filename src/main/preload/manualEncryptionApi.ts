import { contextBridge, ipcRenderer } from 'electron';

export interface ManualEncryptionAPI {
  encryptContent: (
    content: string,
    password: string,
    originalExtension: string,
  ) => Promise<{ success: boolean; data?: any; error?: string }>;
  decryptContent: (
    encryptedData: any,
    password: string,
  ) => Promise<{ success: boolean; data?: string; error?: string }>;
  isManuallyEncrypted: (content: string) => Promise<boolean>;
  getOriginalExtension: (content: string) => Promise<string | null>;
}

const manualEncryptionAPI: ManualEncryptionAPI = {
  async encryptContent(
    content: string,
    password: string,
    originalExtension: string,
  ) {
    return await ipcRenderer.invoke(
      'manual-encryption:encrypt',
      content,
      password,
      originalExtension,
    );
  },

  async decryptContent(encryptedData: any, password: string) {
    return await ipcRenderer.invoke(
      'manual-encryption:decrypt',
      encryptedData,
      password,
    );
  },

  async isManuallyEncrypted(content: string) {
    return await ipcRenderer.invoke('manual-encryption:is-encrypted', content);
  },

  async getOriginalExtension(content: string) {
    return await ipcRenderer.invoke('manual-encryption:get-extension', content);
  },
};

contextBridge.exposeInMainWorld('manualEncryptionAPI', manualEncryptionAPI);
