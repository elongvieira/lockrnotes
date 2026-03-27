import { ipcMain, app, safeStorage } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

const SESSION_FILE_NAME = '.community_session';

function getSessionFilePath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'community', SESSION_FILE_NAME);
}

async function saveSession(session: {
  host: string;
  port: number;
  email: string;
  accessToken: string;
}): Promise<void> {
  const filePath = getSessionFilePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('System encryption is not available');
  }

  const encrypted = safeStorage.encryptString(JSON.stringify(session));
  const wrapper = {
    type: 'lockrnotes-community-session',
    version: '1.0',
    encrypted: encrypted.toString('base64'),
    created: new Date().toISOString(),
  };

  await fs.writeFile(filePath, JSON.stringify(wrapper, null, 2), 'utf8');
}

async function loadSession(): Promise<{
  host: string;
  port: number;
  email: string;
  accessToken: string;
} | null> {
  const filePath = getSessionFilePath();

  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const wrapper = JSON.parse(raw);

    if (
      wrapper.type !== 'lockrnotes-community-session' ||
      wrapper.version !== '1.0'
    ) {
      return null;
    }

    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('System encryption is not available');
    }

    const buffer = Buffer.from(wrapper.encrypted, 'base64');
    const decrypted = safeStorage.decryptString(buffer);
    return JSON.parse(decrypted);
  } catch (err: any) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function deleteSession(): Promise<void> {
  const filePath = getSessionFilePath();
  try {
    await fs.unlink(filePath);
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err;
  }
}

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

        const data = (await response.json()) as { accessToken?: string };
        if (!data.accessToken) {
          return { success: false, error: 'No access token received' };
        }

        await saveSession({ host, port, email, accessToken: data.accessToken });
        return { success: true, email };
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
}
