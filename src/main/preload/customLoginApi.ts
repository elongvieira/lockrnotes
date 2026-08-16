import { ipcRenderer } from 'electron';
import type { CustomLoginStep } from '../../renderer/types/jsonEntry';

export const customLoginApi = {
  record(config: { url: string; title?: string }): Promise<{
    success: boolean;
    steps?: CustomLoginStep[];
    error?: string;
  }> {
    return ipcRenderer.invoke('custom-login:record', config);
  },
  play(config: {
    url: string;
    title?: string;
    steps: CustomLoginStep[];
    loadingMessage?: string;
  }): Promise<{ success: boolean; error?: string }> {
    return ipcRenderer.invoke('custom-login:play', config);
  },
};

export type CustomLoginAPI = typeof customLoginApi;
