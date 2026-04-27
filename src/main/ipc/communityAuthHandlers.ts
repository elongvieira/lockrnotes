import { ipcMain } from 'electron';
import {
  saveSession,
  loadSession,
  deleteSession,
  extractIsAdmin,
} from '../services/communitySessionService';

export function registerCommunityAuthHandlers(): void {
  ipcMain.handle(
    'community:login',
    async (
      _event,
      params: { host: string; port: number; email: string; password: string },
    ) => {
      try {
        const { host, port, email, password } = params;
        const url = `http://${host}:${port}/auth/login`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          let message = `HTTP ${response.status}`;
          try {
            const parsed = JSON.parse(errorBody);
            message = parsed.message || parsed.error || message;
          } catch {
            // keep default message
          }
          return { success: false, error: message };
        }

        const data = (await response.json()) as {
          accessToken?: string;
          forcePasswordChange?: boolean;
          user?: {
            profile?: string;
          };
        };
        if (!data.accessToken) {
          return { success: false, error: 'No access token received' };
        }

        // Determine if user is admin from profile field
        const isAdmin =
          data.user?.profile?.toLowerCase() === 'admin' ||
          extractIsAdmin(data.accessToken);
        await saveSession({
          host,
          port,
          email,
          accessToken: data.accessToken,
          isAdmin,
        });
        return {
          success: true,
          email,
          isAdmin,
          forcePasswordChange: data.forcePasswordChange ?? false,
        };
      } catch (err: any) {
        return { success: false, error: err.message || String(err) };
      }
    },
  );

  ipcMain.handle('community:get-session', async () => {
    try {
      const session = await loadSession();
      if (!session) return { success: true, session: null };
      return {
        success: true,
        session: {
          host: session.host,
          port: session.port,
          email: session.email,
          isAdmin: session.isAdmin ?? false,
          // Do not expose the accessToken to the renderer
        },
      };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  });

  ipcMain.handle('community:logout', async () => {
    try {
      await deleteSession();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  });

  ipcMain.handle(
    'community:change-password',
    async (
      _event,
      params: { currentPassword: string; newPassword: string },
    ) => {
      try {
        const { currentPassword, newPassword } = params;
        const session = await loadSession();

        if (!session) {
          return { success: false, error: 'Not logged in' };
        }

        const url = `http://${session.host}:${session.port}/auth/change-password`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          let message = `HTTP ${response.status}`;
          try {
            const parsed = JSON.parse(errorBody);
            message = parsed.message || parsed.error || message;
          } catch {
            // keep default message
          }
          return { success: false, error: message };
        }

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || String(err) };
      }
    },
  );
}
