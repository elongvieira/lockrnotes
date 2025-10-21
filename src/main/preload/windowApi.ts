import { ipcRenderer } from 'electron';

/**
 * Window controls API exposed to renderer process
 */
export const windowApi = {
  minimize(): Promise<void> {
    return ipcRenderer.invoke('window-minimize');
  },

  close(): Promise<void> {
    return ipcRenderer.invoke('window-close');
  },

  toggleMaximize(): Promise<boolean> {
    return ipcRenderer.invoke('window-toggle-maximize');
  },

  isMaximized(): Promise<boolean> {
    return ipcRenderer.invoke('window-is-maximized');
  },

  setSize(width: number, height: number): Promise<void> {
    return ipcRenderer.invoke('window-set-size', width, height);
  },

  getSize(): Promise<{ width: number; height: number }> {
    return ipcRenderer.invoke('window-get-size');
  },

  selectFolder(initialPath?: string): Promise<string | null> {
    return ipcRenderer.invoke('dialog-open-folder', initialPath);
  },
};
