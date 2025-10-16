import { ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { readConfigFile } from '../config';

/**
 * Recursively read directory contents
 */
async function readDirectoryRecursive(
  dirPath: string,
  options?: any,
): Promise<any[]> {
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

      const isDirectory = item.isDirectory();
      const fileItem: any = {
        id: itemPath,
        name: item.name,
        path: itemPath,
        type: isDirectory ? 'directory' : 'file',
        extension: item.isFile() ? path.extname(item.name) : undefined,
        size: item.isFile() ? stats.size : undefined,
        lastModified: stats.mtime,
        children: undefined,
      };

      // Filter by extensions if specified (only for files)
      if (options?.extensions && item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        if (!options.extensions.includes(ext)) {
          continue;
        }
      }

      // Recursively read subdirectories
      if (isDirectory) {
        try {
          fileItem.children = await readDirectoryRecursive(itemPath, options);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(`Failed to read subdirectory ${itemPath}:`, err);
          fileItem.children = [];
        }
      }

      result.push(fileItem);
    }

    return result;
  } catch (error) {
    console.error('Error reading directory:', error);
    throw error;
  }
}

/**
 * Setup filesystem IPC handlers
 */
export function setupFilesystemHandlers() {
  // Read directory contents
  ipcMain.handle(
    'fs-read-directory',
    async (event, dirPath: string, options?: any) => {
      return readDirectoryRecursive(dirPath, options);
    },
  );

  // Get item information
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

  // Create directory
  ipcMain.handle('fs-create-directory', async (event, dirPath: string) => {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      console.error('Error creating directory:', error);
      return false;
    }
  });

  // Create file
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

  // Save file
  ipcMain.handle(
    'fs-save-file',
    async (event, filePath: string, content: string) => {
      try {
        await fs.promises.writeFile(filePath, content, 'utf8');
        return true;
      } catch (error) {
        console.error('Error saving file:', error);
        return false;
      }
    },
  );

  // Delete item
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

  // Rename/move item
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

  // Read config file
  ipcMain.handle('fs-read-config', async () => {
    try {
      const config = await readConfigFile();
      return config;
    } catch (error) {
      console.error('Error reading config:', error);
      return null;
    }
  });
}
