import { ipcMain, dialog } from 'electron';
import { readConfigFile } from '../config';
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
        const config = await readConfigFile();
        const portuguese =
          !config?.language || String(config.language).startsWith('pt');
        const choice = await dialog.showMessageBox({
          type: 'warning',
          buttons: portuguese
            ? ['Cancelar', 'Exportar mesmo assim']
            : ['Cancel', 'Export anyway'],
          defaultId: 0,
          cancelId: 0,
          noLink: true,
          title: 'Lockr Notes',
          message: portuguese
            ? 'A exportação cria um ZIP com as notas descriptografadas.'
            : 'Export creates a ZIP with decrypted notes.',
          detail: portuguese
            ? 'Quem abrir esse arquivo vê o conteúdo em claro. Guarde o ZIP com o mesmo cuidado de uma senha.'
            : 'Anyone who opens that file can read the contents. Keep the ZIP as carefully as a password.',
        });
        if (choice.response !== 1) {
          return { success: false, canceled: true };
        }

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
