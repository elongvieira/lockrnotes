import path from 'path';
import { ipcMain, BrowserWindow, app } from 'electron';
import { Client, ClientChannel } from 'ssh2';
import { resolveHtmlPath } from '../util';

const sshConnections = new Map<
  string,
  { client: Client; stream: ClientChannel | null; sender: Electron.WebContents }
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

let sessionCounter = 0;

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
      const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      pendingConfigs.set(token, config);

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
        },
      });

      const baseUrl = resolveHtmlPath('index.html');
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
      const sessionId = `ssh_${Date.now()}_${++sessionCounter}`;
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
            finish([config.password]);
          },
        );

        client.connect({
          host: config.host,
          port: config.port || 22,
          username: config.user,
          password: config.password,
          tryKeyboard: true,
          readyTimeout: 15000,
        });
      });
    },
  );

  ipcMain.on('ssh:input', (_event, sessionId: string, data: string) => {
    const conn = sshConnections.get(sessionId);
    if (conn?.stream) conn.stream.write(data);
  });

  ipcMain.on(
    'ssh:resize',
    (_event, sessionId: string, cols: number, rows: number) => {
      const conn = sshConnections.get(sessionId);
      if (conn?.stream) conn.stream.setWindow(rows, cols, 0, 0);
    },
  );

  ipcMain.handle('ssh:disconnect', (_event, sessionId: string) => {
    const conn = sshConnections.get(sessionId);
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
