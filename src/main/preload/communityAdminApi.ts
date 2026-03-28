import { ipcRenderer } from 'electron';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  loginType?: string;
  isActive: boolean;
  forcePasswordChange: boolean;
  profileId?: string;
  profile?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminGroupMember {
  userId: string;
  groupId: string;
  createdAt?: string;
}

export interface AdminGroup {
  id: string;
  name: string;
  encryptionKey?: string;
  members?: AdminGroupMember[];
  createdAt?: string;
  updatedAt?: string;
}

export const communityAdminApi = {
  listUsers(): Promise<{
    success: boolean;
    users?: AdminUser[];
    error?: string;
  }> {
    return ipcRenderer.invoke('community:users:list');
  },

  createUser(params: {
    name: string;
    email: string;
    loginType?: string;
    password?: string;
    profileId?: string;
  }): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    return ipcRenderer.invoke('community:users:create', params);
  },

  updateUser(
    id: string,
    params: {
      name?: string;
      email?: string;
      isActive?: boolean;
      forcePasswordChange?: boolean;
      profileId?: string;
    },
  ): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    return ipcRenderer.invoke('community:users:update', { id, params });
  },

  deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
    return ipcRenderer.invoke('community:users:delete', id);
  },

  activateUser(id: string): Promise<{ success: boolean; error?: string }> {
    return ipcRenderer.invoke('community:users:activate', id);
  },

  deactivateUser(id: string): Promise<{ success: boolean; error?: string }> {
    return ipcRenderer.invoke('community:users:deactivate', id);
  },

  forcePasswordChangeUser(
    id: string,
  ): Promise<{ success: boolean; error?: string }> {
    return ipcRenderer.invoke('community:users:forcePasswordChange', id);
  },

  listGroups(): Promise<{
    success: boolean;
    groups?: AdminGroup[];
    error?: string;
  }> {
    return ipcRenderer.invoke('community:groups:list');
  },

  createGroup(params: {
    name: string;
  }): Promise<{ success: boolean; group?: AdminGroup; error?: string }> {
    return ipcRenderer.invoke('community:groups:create', params);
  },

  updateGroup(
    id: string,
    params: { name: string },
  ): Promise<{ success: boolean; group?: AdminGroup; error?: string }> {
    return ipcRenderer.invoke('community:groups:update', { id, params });
  },

  deleteGroup(id: string): Promise<{ success: boolean; error?: string }> {
    return ipcRenderer.invoke('community:groups:delete', id);
  },

  getGroup(
    id: string,
  ): Promise<{ success: boolean; group?: AdminGroup; error?: string }> {
    return ipcRenderer.invoke('community:groups:get', id);
  },

  addGroupMember(
    groupId: string,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    return ipcRenderer.invoke('community:groups:addMember', {
      groupId,
      userId,
    });
  },

  removeGroupMember(
    groupId: string,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    return ipcRenderer.invoke('community:groups:removeMember', {
      groupId,
      userId,
    });
  },
};

export type CommunityAdminAPI = typeof communityAdminApi;
