import { ipcRenderer } from 'electron';

export const exportApi = {
  selectFolder(): Promise<{ canceled: boolean; folderPath?: string }> {
    return ipcRenderer.invoke('export:selectFolder');
  },

  exportAll(destinationFolder: string): Promise<{
    success: boolean;
    zipPath?: string;
    error?: string;
    filesExported?: number;
  }> {
    return ipcRenderer.invoke('export:exportAll', destinationFolder);
  },
};
