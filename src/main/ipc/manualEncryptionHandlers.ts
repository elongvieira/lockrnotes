import { ipcMain } from 'electron';
import { manualEncryptionService } from '../services/manualEncryptionService';

export function registerManualEncryptionHandlers() {
  // Encrypt content with password
  ipcMain.handle(
    'manual-encryption:encrypt',
    async (
      event,
      content: string,
      password: string,
      originalExtension: string,
    ) => {
      try {
        const encrypted = await manualEncryptionService.encryptContent(
          content,
          password,
          originalExtension,
        );
        return { success: true, data: encrypted };
      } catch (error: any) {
        console.error('Manual encryption error:', error);
        return { success: false, error: error.message };
      }
    },
  );

  // Decrypt content with password
  ipcMain.handle(
    'manual-encryption:decrypt',
    async (event, encryptedData: any, password: string) => {
      try {
        const decrypted = await manualEncryptionService.decryptContent(
          encryptedData,
          password,
        );
        return { success: true, data: decrypted };
      } catch (error: any) {
        console.error('Manual decryption error:', error);
        return { success: false, error: error.message };
      }
    },
  );

  // Check if content is manually encrypted
  ipcMain.handle(
    'manual-encryption:is-encrypted',
    async (event, content: string) => {
      try {
        return manualEncryptionService.isContentManuallyEncrypted(content);
      } catch {
        return false;
      }
    },
  );

  // Get original extension
  ipcMain.handle(
    'manual-encryption:get-extension',
    async (event, content: string) => {
      try {
        return manualEncryptionService.getOriginalExtension(content);
      } catch {
        return null;
      }
    },
  );
}
