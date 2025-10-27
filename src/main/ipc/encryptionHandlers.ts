import { ipcMain } from 'electron';
import { managedEncryptionService } from '../services/managedEncryptionService';

/**
 * Handlers IPC para criptografia gerenciada
 */
export function setupEncryptionHandlers(): void {
  // Criptografar conteúdo
  ipcMain.handle(
    'encryption:encrypt',
    async (_, content: string, filePath: string, originalExtension: string) => {
      try {
        const encrypted = await managedEncryptionService.encryptContent(
          content,
          filePath,
          originalExtension,
        );
        return { success: true, data: encrypted };
      } catch (error: any) {
        console.error('IPC encryption error:', error);
        return { success: false, error: error.message };
      }
    },
  );

  // Descriptografar conteúdo
  ipcMain.handle(
    'encryption:decrypt',
    async (_, encryptedData: any, filePath: string) => {
      try {
        const decrypted = await managedEncryptionService.decryptContent(
          encryptedData,
          filePath,
        );
        return { success: true, data: decrypted };
      } catch (error: any) {
        console.error('IPC decryption error:', error);
        return { success: false, error: error.message };
      }
    },
  );

  // Verificar se conteúdo está criptografado
  ipcMain.handle('encryption:isEncrypted', async (_, content: string) => {
    try {
      const isEncrypted = managedEncryptionService.isContentEncrypted(content);
      return { success: true, data: isEncrypted };
    } catch (error: any) {
      console.error('IPC isEncrypted error:', error);
      return { success: false, error: error.message };
    }
  });

  // Obter extensão original
  ipcMain.handle(
    'encryption:getOriginalExtension',
    async (_, content: string) => {
      try {
        const extension =
          managedEncryptionService.getOriginalExtension(content);
        return { success: true, data: extension };
      } catch (error: any) {
        console.error('IPC getOriginalExtension error:', error);
        return { success: false, error: error.message };
      }
    },
  );

  // Reset do sistema de criptografia
  ipcMain.handle('encryption:reset', async () => {
    try {
      await managedEncryptionService.resetEncryption();
      return { success: true };
    } catch (error: any) {
      console.error('IPC reset encryption error:', error);
      return { success: false, error: error.message };
    }
  });

  // Migrar chave de criptografia entre tipos de armazenamento
  ipcMain.handle(
    'encryption:migrateKeyStorage',
    async (_, newStorageType: string) => {
      try {
        await managedEncryptionService.migrateKeyStorage(newStorageType);
        return { success: true };
      } catch (error: any) {
        console.error('IPC migrate key storage error:', error);
        return { success: false, error: error.message };
      }
    },
  );

  // Encryption IPC handlers registered
}
