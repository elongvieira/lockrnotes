import { ipcRenderer } from 'electron';

export const communityFilesApi = {
  getFiles(
    parentId?: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return ipcRenderer.invoke('community:get-files', parentId);
  },

  getFile(
    id: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return ipcRenderer.invoke('community:get-file', id);
  },

  createFile(payload: {
    name: string;
    type: 'file' | 'folder';
    content?: string;
    parentId?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    return ipcRenderer.invoke('community:create-file', payload);
  },

  updateFile(
    id: string,
    payload: { name?: string; content?: string; parentId?: string },
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return ipcRenderer.invoke('community:update-file', id, payload);
  },

  deleteFile(id: string): Promise<{ success: boolean; error?: string }> {
    return ipcRenderer.invoke('community:delete-file', id);
  },

  getGroups(): Promise<{ success: boolean; data?: any; error?: string }> {
    return ipcRenderer.invoke('community:get-groups');
  },

  getGroupFiles(
    groupId: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return ipcRenderer.invoke('community:get-group-files', groupId);
  },
};

export type CommunityFilesAPI = typeof communityFilesApi;
