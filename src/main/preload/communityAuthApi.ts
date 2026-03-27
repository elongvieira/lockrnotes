import { ipcRenderer } from 'electron';

export const communityAuthApi = {
  login(params: {
    host: string;
    port: number;
    email: string;
    password: string;
  }): Promise<{ success: boolean; email?: string; error?: string }> {
    return ipcRenderer.invoke('community:login', params);
  },

  getSession(): Promise<{
    success: boolean;
    session: { host: string; port: number; email: string } | null;
    error?: string;
  }> {
    return ipcRenderer.invoke('community:get-session');
  },

  logout(): Promise<{ success: boolean; error?: string }> {
    return ipcRenderer.invoke('community:logout');
  },
};

export type CommunityAuthAPI = typeof communityAuthApi;
