import { ipcMain, BrowserWindow } from 'electron';

/**
 * Setup window control IPC handlers
 */
export function setupWindowHandlers(mainWindow: BrowserWindow | null) {
  // Minimize window
  ipcMain.handle('window-minimize', () => {
    if (!mainWindow) return;
    mainWindow.minimize();
  });

  // Close window
  ipcMain.handle('window-close', () => {
    if (!mainWindow) return;
    mainWindow.close();
  });

  // Toggle maximize/restore window
  ipcMain.handle('window-toggle-maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
    return mainWindow.isMaximized();
  });

  // Get window maximized state
  ipcMain.handle('window-is-maximized', () => {
    if (!mainWindow) return false;
    return mainWindow.isMaximized();
  });

  // Set window size
  ipcMain.handle('window-set-size', (event, width: number, height: number) => {
    if (!mainWindow) return;
    mainWindow.setSize(width, height);
  });

  // Get window size
  ipcMain.handle('window-get-size', () => {
    if (!mainWindow) return { width: 0, height: 0 };
    const [width, height] = mainWindow.getSize();
    return { width, height };
  });
}
