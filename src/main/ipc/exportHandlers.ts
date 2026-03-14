import { ipcMain, dialog } from 'electron';
import { exportAllFiles } from '../services/exportService';

// eslint-disable-next-line import/prefer-default-export
export function registerExportHandlers() {
  ipcMain.handle('export:selectFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Export Destination',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }

    return {
      canceled: false,
      folderPath: result.filePaths[0],
    };
  });

  ipcMain.handle(
    'export:exportAll',
    async (_event, destinationFolder: string) => {
      try {
        const result = await exportAllFiles(destinationFolder);
        return result;
      } catch (error) {
        console.error('Export error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  );
}
