import { BrowserWindow } from 'electron';
import { isHttpUrl } from './webLoginUrl';

export const SHARED_LOGIN_PARTITION = 'persist:lockr-web-login-shared';
const ISOLATED_LOGIN_PARTITION_PREFIX = 'persist:lockr-web-login-id-';

export function resolveLoginPartition(options: {
  shareSession?: boolean;
  sessionId?: string;
}): string {
  if (options.shareSession) {
    return SHARED_LOGIN_PARTITION;
  }
  const safe = (options.sessionId || '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 80);
  if (!safe) {
    return `${ISOLATED_LOGIN_PARTITION_PREFIX}missing`;
  }
  return `${ISOLATED_LOGIN_PARTITION_PREFIX}${safe}`;
}

export function suppressLoginWindowDevTools(win: BrowserWindow) {
  const close = () => {
    if (!win.isDestroyed() && win.webContents.isDevToolsOpened()) {
      win.webContents.closeDevTools();
    }
  };
  close();
  win.webContents.on('devtools-opened', close);
  win.webContents.on('did-finish-load', close);
}

export function applyLoginWindowGuards(win: BrowserWindow, partition: string) {
  const currentUa = win.webContents.getUserAgent();
  win.webContents.setUserAgent(currentUa.replace(/\sElectron\/\S+/, ''));
  suppressLoginWindowDevTools(win);

  const blockNonHttp = (
    event: { preventDefault: () => void },
    nextUrl: string,
  ) => {
    if (!isHttpUrl(nextUrl)) {
      event.preventDefault();
    }
  };
  win.webContents.on('will-navigate', blockNonHttp);
  win.webContents.on('will-redirect', blockNonHttp);
  win.webContents.setWindowOpenHandler(({ url: nextUrl }) => {
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
          partition,
        },
      },
    };
  });
  win.webContents.on('did-create-window', (child) => {
    applyLoginWindowGuards(child, partition);
  });
  win.setMenu(null);
}

export function createLoginWindow(
  title: string,
  partition = resolveLoginPartition({}),
) {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    backgroundColor: '#0d1824',
    title,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: false,
      partition,
    },
  });
  applyLoginWindowGuards(win, partition);
  return win;
}
