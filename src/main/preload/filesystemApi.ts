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

  deleteItem(path: string): Promise<boolean> {
    return ipcRenderer.invoke('fs-delete-item', path);
  },

  renameItem(oldPath: string, newPath: string): Promise<boolean> {
    return ipcRenderer.invoke('fs-rename-item', oldPath, newPath);
  },
};
