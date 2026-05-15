import { ipcRenderer } from 'electron';

export const vaultApi = {
  login(params: {
    host: string;
    port: number;
    mountPath?: string;
    authMethod?: 'token' | 'ldap';
    token?: string;
    username?: string;
    password?: string;
  }): Promise<{ success: boolean; error?: string }> {
    return ipcRenderer.invoke('vault:login', params);
  },

  getSession(): Promise<{
    success: boolean;
    session: {
      host: string;
      port: number;
      mountPath: string;
    } | null;
    error?: string;
  }> {
    return ipcRenderer.invoke('vault:get-session');
  },

  logout(): Promise<{ success: boolean; error?: string }> {
    return ipcRenderer.invoke('vault:logout');
  },

  listSecrets(
    path: string,
  ): Promise<{ success: boolean; data?: string[]; error?: string }> {
    return ipcRenderer.invoke('vault:list-secrets', path);
  },

  getSecret(path: string): Promise<{
    success: boolean;
    data?: Record<string, string>;
    metadata?: any;
    notFound?: boolean;
    status?: number;
    error?: string;
  }> {
    return ipcRenderer.invoke('vault:get-secret', path);
  },

  saveSecret(
    path: string,
    data: Record<string, string>,
  ): Promise<{ success: boolean; error?: string }> {
    return ipcRenderer.invoke('vault:save-secret', { path, data });
  },

  deleteSecret(path: string): Promise<{ success: boolean; error?: string }> {
    return ipcRenderer.invoke('vault:delete-secret', path);
  },

  createFolder(path: string): Promise<{ success: boolean; error?: string }> {
    return ipcRenderer.invoke('vault:create-folder', path);
  },
};

export type VaultAPI = typeof vaultApi;
