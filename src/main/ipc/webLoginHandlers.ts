import { ipcMain, type WebContents } from 'electron';
import { buildWebLoginFillScript } from '../services/webLoginFillScript';
import {
  createLoginWindow,
  resolveLoginPartition,
} from '../services/loginWindow';
import { normalizeWebLoginUrl } from '../services/webLoginUrl';

interface WebLoginConfig {
  url: string;
  user: string;
  password: string;
  title?: string;
  shareSession?: boolean;
  sessionId?: string;
}

function injectFillScript(
  contents: WebContents,
  user: string,
  password: string,
) {
  if (contents.isDestroyed()) {
    return;
  }
  contents
    .executeJavaScript(buildWebLoginFillScript(user, password))
    .catch(() => {});
}

export function setupWebLoginHandlers() {
  ipcMain.handle('web-login:open', async (_event, config: WebLoginConfig) => {
    const url = normalizeWebLoginUrl(config?.url || '');
    if (!url) {
      return { success: false, error: 'Invalid URL' };
    }

    const loginWindow = createLoginWindow(
      config.title || 'Web Login',
      resolveLoginPartition({
        shareSession: config?.shareSession,
        sessionId: config?.sessionId,
      }),
    );
    const targetOrigin = new URL(url).origin;

    const inject = () => {
      if (loginWindow.isDestroyed()) {
        return;
      }
      let currentOrigin = '';
      try {
        currentOrigin = new URL(loginWindow.webContents.getURL()).origin;
      } catch {
        return;
      }
      if (currentOrigin !== targetOrigin) {
        return;
      }
      injectFillScript(
        loginWindow.webContents,
        config.user || '',
        config.password || '',
      );
    };

    loginWindow.webContents.on('did-finish-load', inject);
    loginWindow.webContents.on('did-navigate-in-page', inject);

    try {
      loginWindow.show();
      await loginWindow.loadURL(url);
      return { success: true };
    } catch (error) {
      loginWindow.destroy();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open site',
      };
    }
  });
}
