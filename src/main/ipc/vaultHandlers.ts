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
  token?: string,
  options: RequestInit = {},
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['X-Vault-Token'] = token;
  }

  const response = await fetch(url, {
    ...options,
    headers,
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

/**
 * Detect whether the given mount path is a KV v1 or KV v2 secrets engine.
 * Queries /v1/sys/mounts and inspects the `options.version` field.
 * Falls back to v2 if the call fails or the field is absent.
 */
async function detectKvVersion(
  host: string,
  port: number,
  mountPath: string,
  token: string,
): Promise<1 | 2> {
  try {
    const url = `${vaultUrl(host, port)}/v1/sys/mounts`;
    const result = await vaultRequest<any>(url, token);
    if (result.ok && result.data) {
      const mountKey = `${mountPath}/`;
      // The response may be wrapped in a `data` envelope or not.
      const mountInfo = result.data.data?.[mountKey] ?? result.data[mountKey];
      const version = mountInfo?.options?.version;
      if (version === '1' || version === 1) return 1;
    }
  } catch {
    // fall through to default
  }
  return 2;
}

export function registerVaultHandlers(): void {
  // ─── Login (validate token) ─────────────────────────────────
  ipcMain.handle(
    'vault:login',
    async (
      _event,
      params: {
        host: string;
        port: number;
        mountPath?: string;
        authMethod?: 'token' | 'ldap';
        token?: string;
        username?: string;
        password?: string;
      },
    ) => {
      try {
        const {
          host,
          port,
          mountPath = 'secret',
          authMethod = 'token',
          username,
          password,
        } = params;
        let { token } = params;

        if (authMethod === 'ldap') {
          if (!username || !password) {
            return {
              success: false,
              error: 'Username and password required for LDAP login',
            };
          }
          const url = `${vaultUrl(host, port)}/v1/auth/ldap/login/${username}`;
          const result = await vaultRequest<any>(url, undefined, {
            method: 'POST',
            body: JSON.stringify({ password }),
          });

          if (!result.ok) {
            return { success: false, error: result.error };
          }

          token = result.data?.auth?.client_token;
          if (!token) {
            return {
              success: false,
              error: 'Failed to retrieve token from LDAP login',
            };
          }
        } else {
          if (!token) {
            return { success: false, error: 'Token is required' };
          }
          const url = `${vaultUrl(host, port)}/v1/auth/token/lookup-self`;
          const result = await vaultRequest<any>(url, token);
          if (!result.ok) {
            return { success: false, error: result.error };
          }
        }

        const kvVersion = await detectKvVersion(host, port, mountPath, token);
        await saveVaultSession({ host, port, token, mountPath, kvVersion });
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

  // ─── List secrets ────────────────────────────────────────────
  ipcMain.handle('vault:list-secrets', async (_event, secretPath: string) => {
    try {
      const session = await loadVaultSession();
      if (!session) return { success: false, error: 'Not connected to Vault' };

      const kv = session.kvVersion ?? 2;
      const listPath =
        kv === 1
          ? `${vaultUrl(session.host, session.port)}/v1/${session.mountPath}/${secretPath}?list=true`
          : `${vaultUrl(session.host, session.port)}/v1/${session.mountPath}/metadata/${secretPath}?list=true`;

      const result = await vaultRequest<{ data: { keys: string[] } }>(
        listPath,
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

  // ─── Get secret ──────────────────────────────────────────────
  ipcMain.handle('vault:get-secret', async (_event, secretPath: string) => {
    try {
      const session = await loadVaultSession();
      if (!session) return { success: false, error: 'Not connected to Vault' };

      const kv = session.kvVersion ?? 2;

      if (kv === 1) {
        const url = `${vaultUrl(session.host, session.port)}/v1/${session.mountPath}/${secretPath}`;
        const result = await vaultRequest<{ data: Record<string, string> }>(
          url,
          session.token,
        );
        if (!result.ok) {
          return {
            success: false,
            error: result.error,
            status: result.status,
            notFound: result.status === 404,
          };
        }
        return {
          success: true,
          data: result.data?.data ?? {},
          metadata: {},
          status: result.status,
        };
      }

      // KV v2
      const url = `${vaultUrl(session.host, session.port)}/v1/${session.mountPath}/data/${secretPath}`;
      const result = await vaultRequest<{
        data: { data: Record<string, string>; metadata: any };
      }>(url, session.token);

      if (!result.ok) {
        return {
          success: false,
          error: result.error,
          status: result.status,
          notFound: result.status === 404,
        };
      }

      return {
        success: true,
        data: result.data?.data?.data ?? {},
        metadata: result.data?.data?.metadata ?? {},
        status: result.status,
      };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  });

  // ─── Save secret ─────────────────────────────────────────────
  ipcMain.handle(
    'vault:save-secret',
    async (_event, params: { path: string; data: Record<string, string> }) => {
      try {
        const session = await loadVaultSession();
        if (!session)
          return { success: false, error: 'Not connected to Vault' };

        const kv = session.kvVersion ?? 2;

        const url =
          kv === 1
            ? `${vaultUrl(session.host, session.port)}/v1/${session.mountPath}/${params.path}`
            : `${vaultUrl(session.host, session.port)}/v1/${session.mountPath}/data/${params.path}`;

        const body =
          kv === 1
            ? JSON.stringify(params.data)
            : JSON.stringify({ data: params.data });

        const result = await vaultRequest<any>(url, session.token, {
          method: kv === 1 ? 'PUT' : 'POST',
          body,
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

  // ─── Delete secret (permanent) ───────────────────────────────
  ipcMain.handle('vault:delete-secret', async (_event, secretPath: string) => {
    try {
      const session = await loadVaultSession();
      if (!session) return { success: false, error: 'Not connected to Vault' };

      const kv = session.kvVersion ?? 2;

      // KV v1: DELETE /v1/<mount>/<path>
      // KV v2: DELETE /v1/<mount>/metadata/<path>  (removes all versions permanently)
      const url =
        kv === 1
          ? `${vaultUrl(session.host, session.port)}/v1/${session.mountPath}/${secretPath}`
          : `${vaultUrl(session.host, session.port)}/v1/${session.mountPath}/metadata/${secretPath}`;

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

  // ─── Create folder (empty marker secret) ────────────────────
  ipcMain.handle('vault:create-folder', async (_event, folderPath: string) => {
    try {
      const session = await loadVaultSession();
      if (!session) return { success: false, error: 'Not connected to Vault' };

      const kv = session.kvVersion ?? 2;
      const markerPath = `${folderPath}/.folder`;
      const markerData = {
        _type: 'folder',
        _created: new Date().toISOString(),
      };

      const url =
        kv === 1
          ? `${vaultUrl(session.host, session.port)}/v1/${session.mountPath}/${markerPath}`
          : `${vaultUrl(session.host, session.port)}/v1/${session.mountPath}/data/${markerPath}`;

      const body =
        kv === 1
          ? JSON.stringify(markerData)
          : JSON.stringify({ data: markerData });

      const result = await vaultRequest<any>(url, session.token, {
        method: kv === 1 ? 'PUT' : 'POST',
        body,
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
