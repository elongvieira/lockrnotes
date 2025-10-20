import { ipcRenderer } from 'electron';

export const systemApi = {
  getPathSeparator(): Promise<string> {
    return ipcRenderer.invoke('system:get-path-separator').then((res) => {
      if (res && res.success) return res.data;
      throw new Error(res?.error || 'Failed to get path separator');
    });
  },
};

export type SystemAPI = typeof systemApi;
