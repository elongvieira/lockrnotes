import { BrowserWindow } from 'electron';
import { isHttpUrl } from './webLoginUrl';

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

export function applyLoginWindowGuards(win: BrowserWindow) {
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
          partition: 'persist:lockr-web-login',
        },
      },
    };
  });
  win.setMenu(null);
}

export function createLoginWindow(title: string) {
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
      partition: 'persist:lockr-web-login',
    },
  });
  applyLoginWindowGuards(win);
  return win;
}
