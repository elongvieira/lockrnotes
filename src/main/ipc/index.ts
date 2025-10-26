import { BrowserWindow } from 'electron';
import { setupFilesystemHandlers } from './filesystemHandlers';
import { setupWindowHandlers } from './windowHandlers';
import { setupEncryptionHandlers } from './encryptionHandlers';
import { registerManualEncryptionHandlers } from './manualEncryptionHandlers';

/**
 * Setup all IPC handlers
 */
export function setupIpcHandlers(mainWindow: BrowserWindow | null) {
  setupFilesystemHandlers();
  setupWindowHandlers(mainWindow);
  setupEncryptionHandlers();
  registerManualEncryptionHandlers();
}

export * from './filesystemHandlers';
export * from './windowHandlers';
export * from './encryptionHandlers';
