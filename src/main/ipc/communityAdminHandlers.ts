import { ipcMain } from 'electron';
import { loadSession } from '../services/communitySessionService';

interface AdminUser {
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

async function communityRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  endpoint: string,
  body?: unknown,
): Promise<T> {
  const session = await loadSession();
  if (!session) throw new Error('Not authenticated');

  const url = `http://${session.host}:${session.port}/${endpoint}`;
  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
    },
  };
  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    let message = `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(errorText) as {
        message?: string | string[];
        error?: string;
      };
      const raw = parsed.message;
      message = Array.isArray(raw)
        ? raw.join(', ')
        : (raw ?? parsed.error ?? message);
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json() as Promise<T>;
  }
  return null as T;
}

export function registerCommunityAdminHandlers(): void {
  ipcMain.handle('community:users:list', async () => {
    try {
      const users = await communityRequest<AdminUser[]>('GET', 'users');
      return { success: true, users };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  });

  ipcMain.handle(
    'community:users:create',
    async (
      _event,
      params: {
        name: string;
        email: string;
        loginType?: string;
        password?: string;
        profileId?: string;
      },
    ) => {
      try {
        const user = await communityRequest<AdminUser>('POST', 'users', params);
        return { success: true, user };
      } catch (err: any) {
        return { success: false, error: err.message || String(err) };
      }
    },
  );

  ipcMain.handle(
    'community:users:update',
    async (
      _event,
      data: {
        id: string;
        params: {
          name?: string;
          email?: string;
          isActive?: boolean;
          forcePasswordChange?: boolean;
          profileId?: string;
        };
      },
    ) => {
      try {
        const user = await communityRequest<AdminUser>(
          'PATCH',
          `users/${data.id}`,
          data.params,
        );
        return { success: true, user };
      } catch (err: any) {
        return { success: false, error: err.message || String(err) };
      }
    },
  );

  ipcMain.handle('community:users:delete', async (_event, id: string) => {
    try {
      await communityRequest('DELETE', `users/${id}`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  });

  ipcMain.handle('community:users:activate', async (_event, id: string) => {
    try {
      await communityRequest('POST', `users/${id}/activate`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  });

  ipcMain.handle('community:users:deactivate', async (_event, id: string) => {
    try {
      await communityRequest('POST', `users/${id}/deactivate`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  });

  ipcMain.handle(
    'community:users:forcePasswordChange',
    async (_event, id: string) => {
      try {
        await communityRequest('POST', `users/${id}/force-password-change`);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || String(err) };
      }
    },
  );

  // ─── Groups ─────────────────────────────────────────────────────────────────

  ipcMain.handle('community:groups:list', async () => {
    try {
      const groups = await communityRequest<any[]>('GET', 'groups');
      return { success: true, groups };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  });

  ipcMain.handle(
    'community:groups:create',
    async (_event, params: { name: string }) => {
      try {
        const group = await communityRequest<any>('POST', 'groups', params);
        return { success: true, group };
      } catch (err: any) {
        return { success: false, error: err.message || String(err) };
      }
    },
  );

  ipcMain.handle(
    'community:groups:update',
    async (_event, data: { id: string; params: { name: string } }) => {
      try {
        const group = await communityRequest<any>(
          'PATCH',
          `groups/${data.id}`,
          data.params,
        );
        return { success: true, group };
      } catch (err: any) {
        return { success: false, error: err.message || String(err) };
      }
    },
  );

  ipcMain.handle('community:groups:delete', async (_event, id: string) => {
    try {
      await communityRequest('DELETE', `groups/${id}`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  });

  ipcMain.handle('community:groups:get', async (_event, id: string) => {
    try {
      const group = await communityRequest<any>('GET', `groups/${id}`);
      return { success: true, group };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  });

  ipcMain.handle(
    'community:groups:addMember',
    async (_event, data: { groupId: string; userId: string }) => {
      try {
        await communityRequest('POST', `groups/${data.groupId}/members`, {
          userId: data.userId,
        });
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || String(err) };
      }
    },
  );

  ipcMain.handle(
    'community:groups:removeMember',
    async (_event, data: { groupId: string; userId: string }) => {
      try {
        await communityRequest(
          'DELETE',
          `groups/${data.groupId}/members/${data.userId}`,
        );
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || String(err) };
      }
    },
  );
}
