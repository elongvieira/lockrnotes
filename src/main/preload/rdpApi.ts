import { ipcRenderer } from 'electron';

export const rdpApi = {
  connect(config: {
    host: string;
    port?: number;
    user: string;
    password: string;
    domain?: string;
    title?: string;
  }): Promise<{ success: boolean; error?: string }> {
    return ipcRenderer.invoke('rdp:connect', config);
  },
};

export type RdpAPI = typeof rdpApi;
