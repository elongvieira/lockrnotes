import { ipcRenderer } from 'electron';

export const webLoginApi = {
  open(config: {
    url: string;
    user: string;
    password: string;
    title?: string;
    shareSession?: boolean;
    sessionId?: string;
  }): Promise<{ success: boolean; error?: string }> {
    return ipcRenderer.invoke('web-login:open', config);
  },
};

export type WebLoginAPI = typeof webLoginApi;
