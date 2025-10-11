// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import {
  FileSystemItem,
  DirectoryReadOptions,
} from '../renderer/types/filesystem';

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  // Window controls exposed for a frameless window
  window: {
    minimize() {
      return ipcRenderer.invoke('window-minimize');
    },
    close() {
      return ipcRenderer.invoke('window-close');
    },
    async toggleMaximize() {
      return ipcRenderer.invoke('window-toggle-maximize');
    },
  },
  // Filesystem API exposed to renderer
  filesystem: {
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
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
