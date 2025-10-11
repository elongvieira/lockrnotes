/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import fs from 'fs';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { resolveHtmlPath } from './util';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('logo_lock_a.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
    // Make the window frameless so we can render a custom title bar in the renderer
    // Keep traffic light/titlebar behaviour on macOS by using titleBarStyle
    frame: false,
    ...(process.platform === 'darwin' ? { titleBarStyle: 'hiddenInset' } : {}),
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  // Remove application menu (hide menu bar)
  try {
    // Hide the menu bar entirely
    mainWindow.setMenu(null);
  } catch (err) {
    console.error('Failed to remove application menu', err);
  }

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Window control IPC handlers (from renderer TitleBar)
  ipcMain.handle('window-minimize', () => {
    if (!mainWindow) return;
    mainWindow.minimize();
  });

  ipcMain.handle('window-close', () => {
    if (!mainWindow) return;
    mainWindow.close();
  });

  ipcMain.handle('window-toggle-maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
    return mainWindow.isMaximized();
  });

  // Filesystem IPC handlers
  ipcMain.handle(
    'fs-read-directory',
    async (event, dirPath: string, options?: any) => {
      try {
        const items = await fs.promises.readdir(dirPath, {
          withFileTypes: true,
        });
        const result = [];

        for (const item of items) {
          const itemPath = path.join(dirPath, item.name);
          const stats = await fs.promises.stat(itemPath);

          // Skip hidden files if not requested
          if (!options?.includeHidden && item.name.startsWith('.')) {
            continue;
          }

          const fileItem = {
            id: itemPath,
            name: item.name,
            path: itemPath,
            type: item.isDirectory() ? 'directory' : 'file',
            extension: item.isFile() ? path.extname(item.name) : undefined,
            size: item.isFile() ? stats.size : undefined,
            lastModified: stats.mtime,
            children: undefined, // We'll implement recursive loading separately if needed
          };

          // Filter by extensions if specified
          if (options?.extensions && item.isFile()) {
            const ext = path.extname(item.name).toLowerCase();
            if (!options.extensions.includes(ext)) {
              continue;
            }
          }

          result.push(fileItem);
        }

        return result;
      } catch (error) {
        console.error('Error reading directory:', error);
        throw error;
      }
    },
  );

  ipcMain.handle('fs-get-item', async (event, itemPath: string) => {
    try {
      const stats = await fs.promises.stat(itemPath);
      const isDirectory = stats.isDirectory();

      return {
        id: itemPath,
        name: path.basename(itemPath),
        path: itemPath,
        type: isDirectory ? 'directory' : 'file',
        extension: !isDirectory ? path.extname(itemPath) : undefined,
        size: !isDirectory ? stats.size : undefined,
        lastModified: stats.mtime,
      };
    } catch (error) {
      console.error('Error getting item:', error);
      return null;
    }
  });

  ipcMain.handle('fs-create-directory', async (event, dirPath: string) => {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      console.error('Error creating directory:', error);
      return false;
    }
  });

  ipcMain.handle(
    'fs-create-file',
    async (event, filePath: string, content = '') => {
      try {
        await fs.promises.writeFile(filePath, content, 'utf8');
        return true;
      } catch (error) {
        console.error('Error creating file:', error);
        return false;
      }
    },
  );

  ipcMain.handle('fs-delete-item', async (event, itemPath: string) => {
    try {
      const stats = await fs.promises.stat(itemPath);
      if (stats.isDirectory()) {
        await fs.promises.rmdir(itemPath, { recursive: true });
      } else {
        await fs.promises.unlink(itemPath);
      }
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      return false;
    }
  });

  ipcMain.handle(
    'fs-rename-item',
    async (event, oldPath: string, newPath: string) => {
      try {
        await fs.promises.rename(oldPath, newPath);
        return true;
      } catch (error) {
        console.error('Error renaming item:', error);
        return false;
      }
    },
  );

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
