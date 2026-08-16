import { BrowserWindow, ipcMain, type WebContents } from 'electron';
import { buildWebLoginFillScript } from '../services/webLoginFillScript';
import { isHttpUrl, normalizeWebLoginUrl } from '../services/webLoginUrl';

interface WebLoginConfig {
  url: string;
  user: string;
  password: string;
  title?: string;
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

    const loginWindow = new BrowserWindow({
      width: 1100,
      height: 800,
      backgroundColor: '#ffffff',
      title: config.title || 'Web Login',
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webviewTag: false,
        partition: 'persist:lockr-web-login',
      },
    });

    const currentUa = loginWindow.webContents.getUserAgent();
    loginWindow.webContents.setUserAgent(
      currentUa.replace(/\sElectron\/\S+/, ''),
    );

    const inject = () => {
      injectFillScript(
        loginWindow.webContents,
        config.user || '',
        config.password || '',
      );
    };

    loginWindow.webContents.on('did-finish-load', inject);
    loginWindow.webContents.on('did-navigate-in-page', inject);

    const blockNonHttp = (
      event: { preventDefault: () => void },
      nextUrl: string,
    ) => {
      if (!isHttpUrl(nextUrl)) {
        event.preventDefault();
      }
    };
    loginWindow.webContents.on('will-navigate', blockNonHttp);
    loginWindow.webContents.on('will-redirect', blockNonHttp);

    loginWindow.webContents.setWindowOpenHandler(({ url: nextUrl }) => {
      if (!isHttpUrl(nextUrl)) {
        return { action: 'deny' };
      }
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          autoHideMenuBar: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            partition: 'persist:lockr-web-login',
          },
        },
      };
    });

    loginWindow.setMenu(null);

    try {
      await loginWindow.loadURL(url);
      loginWindow.show();
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
