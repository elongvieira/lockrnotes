import { ipcRenderer } from 'electron';

export const communityAuthApi = {
  login(params: {
    host: string;
    port: number;
    email: string;
    password: string;
  }): Promise<{
    success: boolean;
    email?: string;
    isAdmin?: boolean;
    forcePasswordChange?: boolean;
    error?: string;
  }> {
    return ipcRenderer.invoke('community:login', params);
  },

  getSession(): Promise<{
    success: boolean;
    session: {
      host: string;
      port: number;
      email: string;
      isAdmin: boolean;
    } | null;
    error?: string;
  }> {
    return ipcRenderer.invoke('community:get-session');
  },

  logout(): Promise<{ success: boolean; error?: string }> {
    return ipcRenderer.invoke('community:logout');
  },

  changePassword(params: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{
    success: boolean;
    error?: string;
  }> {
    return ipcRenderer.invoke('community:change-password', params);
  },
};

export type CommunityAuthAPI = typeof communityAuthApi;
