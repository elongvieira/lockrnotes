import { ipcRenderer } from 'electron';
import {
  FileSystemItem,
  DirectoryReadOptions,
} from '../../renderer/types/filesystem';

/**
 * Filesystem API exposed to renderer process
 */
export const filesystemApi = {
  readDirectory(
    path: string,
    options?: DirectoryReadOptions,
  ): Promise<FileSystemItem[]> {
    return ipcRenderer.invoke('fs-read-directory', path, options);
  },

  getItem(path: string): Promise<FileSystemItem | null> {
    return ipcRenderer.invoke('fs-get-item', path);
  },

  createDirectory(path: string): Promise<boolean> {
    return ipcRenderer.invoke('fs-create-directory', path);
  },

  createFile(path: string, content?: string): Promise<boolean> {
    return ipcRenderer.invoke('fs-create-file', path, content);
  },

  saveFile(path: string, content: string): Promise<boolean> {
    return ipcRenderer.invoke('fs-save-file', path, content);
  },

  readFile(path: string): Promise<string | null> {
    return ipcRenderer.invoke('fs-read-file', path);
  },

  deleteItem(path: string): Promise<boolean> {
    return ipcRenderer.invoke('fs-delete-item', path);
  },

  renameItem(oldPath: string, newPath: string): Promise<boolean> {
    return ipcRenderer.invoke('fs-rename-item', oldPath, newPath);
  },

  readConfig(): Promise<any | null> {
    return ipcRenderer.invoke('fs-read-config');
  },

  readConfigDebug(): Promise<string | null> {
    return ipcRenderer.invoke('fs-read-config-debug');
  },

  updateConfig(updates: any): Promise<boolean> {
    return ipcRenderer.invoke('fs-update-config', updates);
  },

  getDefaultNotesDirectory(): Promise<string> {
    return ipcRenderer.invoke('fs-get-default-notes-directory');
  },

  decryptFile(filePath: string): Promise<{
    success: boolean;
    filePath?: string;
    fileName?: string;
    error?: string;
  }> {
    return ipcRenderer.invoke('fs-decrypt-file', filePath);
  },

  copyDirectory(
    sourceDir: string,
    destDir: string,
  ): Promise<{ success: boolean; error?: string }> {
    return ipcRenderer.invoke('fs-copy-directory', sourceDir, destDir);
  },
};
