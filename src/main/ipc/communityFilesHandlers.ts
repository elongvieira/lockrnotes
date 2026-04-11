import { ipcMain } from 'electron';
import { loadSession } from '../services/communitySessionService';

export function registerCommunityFilesHandlers(): void {
  // GET /files
  ipcMain.handle('community:get-files', async (_event, parentId?: string) => {
    try {
      const session = await loadSession();
      if (!session) return { success: false, error: 'Not logged in' };

      let url = 'http://' + session.host + ':' + session.port + '/files';
      if (parentId) {
        url += '?parentId=' + encodeURIComponent(parentId);
      }

      const response = await fetch(url, {
        headers: {
          Authorization: 'Bearer ' + session.accessToken,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: errorText || 'HTTP ' + response.status };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  });

  // GET /files/:id
  ipcMain.handle('community:get-file', async (_event, id: string) => {
    try {
      const session = await loadSession();
      if (!session) return { success: false, error: 'Not logged in' };

      const url = 'http://' + session.host + ':' + session.port + '/files/' + encodeURIComponent(id);

      const response = await fetch(url, {
        headers: {
          Authorization: 'Bearer ' + session.accessToken,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: errorText || 'HTTP ' + response.status };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  });

  // POST /files
  ipcMain.handle(
    'community:create-file',
    async (_event, payload: { name: string; type: 'file' | 'folder'; content?: string; parentId?: string }) => {
      try {
        const session = await loadSession();
        if (!session) return { success: false, error: 'Not logged in' };

        const url = 'http://' + session.host + ':' + session.port + '/files';

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + session.accessToken,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          return { success: false, error: errorText || 'HTTP ' + response.status };
        }

        const data = await response.json();
        return { success: true, data };
      } catch (err: any) {
        return { success: false, error: err.message || String(err) };
      }
    }
  );

  // PATCH /files/:id
  ipcMain.handle(
    'community:update-file',
    async (_event, id: string, payload: { name?: string; content?: string; parentId?: string }) => {
      try {
        const session = await loadSession();
        if (!session) return { success: false, error: 'Not logged in' };

        const url = 'http://' + session.host + ':' + session.port + '/files/' + encodeURIComponent(id);

        const response = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + session.accessToken,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          return { success: false, error: errorText || 'HTTP ' + response.status };
        }

        const data = await response.json();
        return { success: true, data };
      } catch (err: any) {
        return { success: false, error: err.message || String(err) };
      }
    }
  );

  // DELETE /files/:id
  ipcMain.handle('community:delete-file', async (_event, id: string) => {
    try {
      const session = await loadSession();
      if (!session) return { success: false, error: 'Not logged in' };

      const url = 'http://' + session.host + ':' + session.port + '/files/' + encodeURIComponent(id);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + session.accessToken,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: errorText || 'HTTP ' + response.status };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  });

  // GET /groups
  ipcMain.handle('community:get-groups', async () => {
    try {
      const session = await loadSession();
      if (!session) return { success: false, error: 'Not logged in' };

      const url = 'http://' + session.host + ':' + session.port + '/groups';

      const response = await fetch(url, {
        headers: {
          Authorization: 'Bearer ' + session.accessToken,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: errorText || 'HTTP ' + response.status };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  });

  // GET /groups/:id/files
  ipcMain.handle('community:get-group-files', async (_event, groupId: string) => {
    try {
      const session = await loadSession();
      if (!session) return { success: false, error: 'Not logged in' };

      const url = 'http://' + session.host + ':' + session.port + '/groups/' + encodeURIComponent(groupId) + '/files';

      const response = await fetch(url, {
        headers: {
          Authorization: 'Bearer ' + session.accessToken,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: errorText || 'HTTP ' + response.status };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  });
}
