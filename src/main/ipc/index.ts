import { BrowserWindow } from 'electron';
import { setupFilesystemHandlers } from './filesystemHandlers';
import { setupWindowHandlers } from './windowHandlers';
import { setupEncryptionHandlers } from './encryptionHandlers';
import { registerManualEncryptionHandlers } from './manualEncryptionHandlers';
import { registerExportHandlers } from './exportHandlers';
import { registerHotCopyHandlers } from './hotcopyHandlers';
import { setupSshHandlers } from './sshHandlers';

/**
 * Setup all IPC handlers
 */
export function setupIpcHandlers(mainWindow: BrowserWindow | null) {
  setupFilesystemHandlers();
  setupWindowHandlers(mainWindow);
  setupEncryptionHandlers();
  registerManualEncryptionHandlers();
  registerExportHandlers();
  registerHotCopyHandlers();
  setupSshHandlers(mainWindow);
}

export * from './filesystemHandlers';
export * from './windowHandlers';
export * from './encryptionHandlers';
