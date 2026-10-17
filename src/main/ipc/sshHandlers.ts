import crypto from 'crypto';
import path from 'path';
import { ipcMain, BrowserWindow, app, type WebContents } from 'electron';
import { Client, ClientChannel } from 'ssh2';
import { parseRemoteTarget } from '../services/remoteConnection';
import { acceptHostKey } from '../services/sshKnownHosts';
import { guardAppNavigation } from '../navigationGuard';
import { resolveHtmlPath } from '../util';

const sshConnections = new Map<
  string,
  { client: Client; stream: ClientChannel | null; sender: WebContents }
>();

const pendingConfigs = new Map<
  string,
  {
    host: string;
    user: string;
    password: string;
    port?: number;
    title: string;
  }
>();

export function setupSshHandlers(_mainWindow: BrowserWindow | null) {
  // Open SSH terminal in a dedicated window
  ipcMain.handle(
    'ssh:open-window',
    async (
      _event,
      config: {
        host: string;
        user: string;
        password: string;
        port?: number;
        title: string;
      },
    ) => {
      const target = parseRemoteTarget(config, 22);
      if (!target) {
        return { success: false, error: 'Invalid SSH target' };
      }
      const token = `token_${crypto.randomUUID()}`;
      pendingConfigs.set(token, {
        ...config,
        host: target.host,
        user: target.user,
        password: target.password,
        port: target.port,
      });

      const preloadPath = app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js');

      const sshWindow = new BrowserWindow({
        width: 900,
        height: 620,
        backgroundColor: '#021624',
        frame: false,
        ...(process.platform === 'darwin'
          ? { titleBarStyle: 'hiddenInset' as const }
          : {}),
        webPreferences: {
          preload: preloadPath,
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
          webviewTag: false,
        },
      });

      const baseUrl = resolveHtmlPath('index.html');
      guardAppNavigation(sshWindow.webContents, baseUrl);
      await sshWindow.loadURL(`${baseUrl}#ssh-terminal/${token}`);
      sshWindow.setMenu(null);
      sshWindow.show();

      return { success: true };
    },
  );

  // Retrieve and consume the stored config (single-use token)
  ipcMain.handle('ssh:get-config', (_event, token: string) => {
    const config = pendingConfigs.get(token);
    if (!config) return { success: false, error: 'Invalid or expired token' };
    pendingConfigs.delete(token);
    return { success: true, config };
  });

  // Connect – routes data back to the calling window (works for any window)
  ipcMain.handle(
    'ssh:connect',
    async (
      event,
      config: { host: string; user: string; password: string; port?: number },
    ) => {
      const target = parseRemoteTarget(config, 22);
      if (!target) {
        return { success: false, error: 'Invalid SSH target' };
      }
      const sessionId = `ssh_${crypto.randomUUID()}`;
      const client = new Client();
      const { sender } = event;

      return new Promise<{
        success: boolean;
        sessionId?: string;
        error?: string;
      }>((resolve) => {
        client.on('ready', () => {
          client.shell(
            { term: 'xterm-256color', cols: 80, rows: 24 },
            (err, stream) => {
              if (err) {
                client.end();
                resolve({ success: false, error: err.message });
                return;
              }

              sshConnections.set(sessionId, { client, stream, sender });

              stream.on('data', (data: Buffer) => {
                if (!sender.isDestroyed()) {
                  sender.send('ssh:data', sessionId, data.toString('utf-8'));
                }
              });

              stream.on('close', () => {
                if (!sender.isDestroyed()) {
                  sender.send('ssh:closed', sessionId);
                }
                sshConnections.delete(sessionId);
                client.end();
              });

              resolve({ success: true, sessionId });
            },
          );
        });

        client.on('error', (err) => {
          sshConnections.delete(sessionId);
          resolve({ success: false, error: err.message });
        });

        client.on(
          'keyboard-interactive',
          (_name, _instructions, _instrLang, _prompts, finish) => {
            finish([target.password]);
          },
        );

        client.connect({
          host: target.host,
          port: target.port,
          username: target.user,
          password: target.password,
          hostVerifier: (key: Buffer, verify: (valid: boolean) => void) => {
            acceptHostKey(target.host, target.port, key)
              .then(verify)
              .catch(() => verify(false));
          },
          tryKeyboard: true,
          readyTimeout: 15000,
        });
      });
    },
  );

  function ownedSession(sender: WebContents, sessionId: string) {
    const conn = sshConnections.get(sessionId);
    if (!conn || conn.sender !== sender) return null;
    return conn;
  }

  ipcMain.on('ssh:input', (event, sessionId: string, data: string) => {
    const conn = ownedSession(event.sender, sessionId);
    if (conn?.stream && typeof data === 'string') conn.stream.write(data);
  });

  ipcMain.on(
    'ssh:resize',
    (event, sessionId: string, cols: number, rows: number) => {
      const conn = ownedSession(event.sender, sessionId);
      if (conn?.stream) conn.stream.setWindow(rows, cols, 0, 0);
    },
  );

  ipcMain.handle('ssh:disconnect', (event, sessionId: string) => {
    const conn = ownedSession(event.sender, sessionId);
    if (conn) {
      if (conn.stream) conn.stream.close();
      conn.client.end();
      sshConnections.delete(sessionId);
    }
    return { success: true };
  });

  ipcMain.handle('ssh:close-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) win.close();
  });
}
