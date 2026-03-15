import { ipcRenderer } from 'electron';

export const sshApi = {
  openWindow(config: {
    host: string;
    user: string;
    password: string;
    port?: number;
    title: string;
  }): Promise<{ success: boolean }> {
    return ipcRenderer.invoke('ssh:open-window', config);
  },

  getConfig(token: string): Promise<{
    success: boolean;
    config?: {
      host: string;
      user: string;
      password: string;
      port?: number;
      title: string;
    };
    error?: string;
  }> {
    return ipcRenderer.invoke('ssh:get-config', token);
  },

  connect(config: {
    host: string;
    user: string;
    password: string;
    port?: number;
  }): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    return ipcRenderer.invoke('ssh:connect', config);
  },

  sendInput(sessionId: string, data: string): void {
    ipcRenderer.send('ssh:input', sessionId, data);
  },

  resize(sessionId: string, cols: number, rows: number): void {
    ipcRenderer.send('ssh:resize', sessionId, cols, rows);
  },

  disconnect(sessionId: string): Promise<{ success: boolean }> {
    return ipcRenderer.invoke('ssh:disconnect', sessionId);
  },

  onData(callback: (sessionId: string, data: string) => void): () => void {
    const handler = (
      _event: Electron.IpcRendererEvent,
      sessionId: string,
      data: string,
    ) => {
      callback(sessionId, data);
    };
    ipcRenderer.on('ssh:data', handler);
    return () => ipcRenderer.removeListener('ssh:data', handler);
  },

  onClosed(callback: (sessionId: string) => void): () => void {
    const handler = (_event: Electron.IpcRendererEvent, sessionId: string) => {
      callback(sessionId);
    };
    ipcRenderer.on('ssh:closed', handler);
    return () => ipcRenderer.removeListener('ssh:closed', handler);
  },

  closeWindow(): Promise<void> {
    return ipcRenderer.invoke('ssh:close-window');
  },
};

export type SshAPI = typeof sshApi;
