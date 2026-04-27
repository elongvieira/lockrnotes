/* global RequestInit */
import { ipcMain } from 'electron';
import {
  saveVaultSession,
  loadVaultSession,
  deleteVaultSession,
} from '../services/vaultSessionService';

/** Build the base URL for a Vault instance. */
function vaultUrl(host: string, port: number): string {
  return `http://${host}:${port}`;
}

/** Helper: perform an authenticated Vault HTTP request. */
async function vaultRequest<T>(
  url: string,
  token: string,
  options: RequestInit = {},
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'X-Vault-Token': token,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    let message = `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(body);
      if (parsed.errors?.length) {
        message = parsed.errors.join('; ');
      }
    } catch {
      // keep default message
    }
    return { ok: false, status: response.status, error: message };
  }

  // DELETE returns 204 No Content
  if (response.status === 204) {
    return { ok: true, status: 204 };
  }

  const data = (await response.json()) as T;
  return { ok: true, status: response.status, data };
}

export function registerVaultHandlers(): void {
  // ─── Login (validate token) ─────────────────────────────────
  ipcMain.handle(
    'vault:login',
    async (
      _event,
      params: { host: string; port: number; token: string; mountPath?: string },
    ) => {
      try {
        const { host, port, token, mountPath = 'secret' } = params;
        const url = `${vaultUrl(host, port)}/v1/auth/token/lookup-self`;

        const result = await vaultRequest<any>(url, token);
        if (!result.ok) {
          return { success: false, error: result.error };
        }

        await saveVaultSession({ host, port, token, mountPath });
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || String(err) };
      }
    },
  );

  // ─── Get session ────────────────────────────────────────────
  ipcMain.handle('vault:get-session', async () => {
    try {
      const session = await loadVaultSession();
      if (!session) return { success: true, session: null };
      return {
        success: true,
        session: {
          host: session.host,
          port: session.port,
          mountPath: session.mountPath,
          // Do not expose the token to the renderer
        },
      };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  });

  // ─── Logout ─────────────────────────────────────────────────
  ipcMain.handle('vault:logout', async () => {
    try {
      await deleteVaultSession();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  });

  // ─── List secrets (KV v2 metadata list) ─────────────────────
  ipcMain.handle('vault:list-secrets', async (_event, secretPath: string) => {
    try {
      const session = await loadVaultSession();
      if (!session) return { success: false, error: 'Not connected to Vault' };

      const url = `${vaultUrl(session.host, session.port)}/v1/${session.mountPath}/metadata/${secretPath}?list=true`;
      const result = await vaultRequest<{ data: { keys: string[] } }>(
        url,
        session.token,
      );

      if (!result.ok) {
        // 404 means empty path — return empty list
        if (result.status === 404) {
          return { success: true, data: [] };
        }
        return { success: false, error: result.error };
      }

      const keys = result.data?.data?.keys ?? [];
      return { success: true, data: keys };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  });

  // ─── Get secret (KV v2 data read) ──────────────────────────
  ipcMain.handle('vault:get-secret', async (_event, secretPath: string) => {
    try {
      const session = await loadVaultSession();
      if (!session) return { success: false, error: 'Not connected to Vault' };

      const url = `${vaultUrl(session.host, session.port)}/v1/${session.mountPath}/data/${secretPath}`;
      const result = await vaultRequest<{
        data: { data: Record<string, string>; metadata: any };
      }>(url, session.token);

      if (!result.ok) {
        return { success: false, error: result.error };
      }

      return {
        success: true,
        data: result.data?.data?.data ?? {},
        metadata: result.data?.data?.metadata ?? {},
      };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  });

  // ─── Save secret (KV v2 data write) ────────────────────────
  ipcMain.handle(
    'vault:save-secret',
    async (_event, params: { path: string; data: Record<string, string> }) => {
      try {
        const session = await loadVaultSession();
        if (!session)
          return { success: false, error: 'Not connected to Vault' };

        const url = `${vaultUrl(session.host, session.port)}/v1/${session.mountPath}/data/${params.path}`;
        const result = await vaultRequest<any>(url, session.token, {
          method: 'POST',
          body: JSON.stringify({ data: params.data }),
        });

        if (!result.ok) {
          return { success: false, error: result.error };
        }

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || String(err) };
      }
    },
  );

  // ─── Delete secret (KV v2 metadata delete — permanent) ─────
  ipcMain.handle('vault:delete-secret', async (_event, secretPath: string) => {
    try {
      const session = await loadVaultSession();
      if (!session) return { success: false, error: 'Not connected to Vault' };

      const url = `${vaultUrl(session.host, session.port)}/v1/${session.mountPath}/metadata/${secretPath}`;
      const result = await vaultRequest<any>(url, session.token, {
        method: 'DELETE',
      });

      if (!result.ok) {
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  });

  // ─── Create folder (empty marker secret) ───────────────────
  ipcMain.handle('vault:create-folder', async (_event, folderPath: string) => {
    try {
      const session = await loadVaultSession();
      if (!session) return { success: false, error: 'Not connected to Vault' };

      // In KV v2, "folders" are just path prefixes.
      // We create a hidden marker secret so the folder appears in listings.
      const markerPath = `${folderPath}/.folder`;
      const url = `${vaultUrl(session.host, session.port)}/v1/${session.mountPath}/data/${markerPath}`;
      const result = await vaultRequest<any>(url, session.token, {
        method: 'POST',
        body: JSON.stringify({
          data: { _type: 'folder', _created: new Date().toISOString() },
        }),
      });

      if (!result.ok) {
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  });
}
