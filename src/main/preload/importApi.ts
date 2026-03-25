import { ipcRenderer } from 'electron';

export interface ImportFileInfo {
  name: string;
  path: string;
  content: string;
  ext: string;
}

export const importApi = {
  selectFiles(): Promise<{ canceled: boolean; files: ImportFileInfo[] }> {
    return ipcRenderer.invoke('import:selectFiles');
  },

  selectDestinationFolder(): Promise<{
    canceled: boolean;
    folderPath?: string;
    outsideRoot?: boolean;
    notesRoot?: string;
  }> {
    return ipcRenderer.invoke('import:selectDestinationFolder');
  },

  getNotesRootPath(): Promise<string | null> {
    return ipcRenderer.invoke('import:getNotesRootPath');
  },

  writeFile(
    filePath: string,
    content: string,
  ): Promise<{ success: boolean; error?: string }> {
    return ipcRenderer.invoke('import:writeFile', filePath, content);
  },

  fileExists(filePath: string): Promise<boolean> {
    return ipcRenderer.invoke('import:fileExists', filePath);
  },
};
