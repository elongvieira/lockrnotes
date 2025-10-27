import { ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { readConfigFile, updateConfigFile } from '../config';
import { managedEncryptionService } from '../services/managedEncryptionService';

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
      const result = await readDirectoryRecursive(dirPath, options);
      return result;
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

  // Read file content
  ipcMain.handle('fs-read-file', async (event, filePath: string) => {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      return content;
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  });

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
        // Check if the file is encrypted
        const fileContent = await fs.promises.readFile(oldPath, 'utf8');

        if (managedEncryptionService.isContentEncrypted(fileContent)) {
          // File is encrypted - need to re-encrypt with new path key
          try {
            // Decrypt with old path
            const encryptedData = JSON.parse(fileContent);
            const decryptedContent =
              await managedEncryptionService.decryptContent(
                encryptedData,
                oldPath,
              );

            // Get original extension from encrypted data
            const originalExtension = encryptedData.originalExtension || '.txt';

            // Re-encrypt with new path
            const newEncryptedData =
              await managedEncryptionService.encryptContent(
                decryptedContent,
                newPath,
                originalExtension,
              );

            // Write encrypted data to new location
            await fs.promises.writeFile(
              newPath,
              JSON.stringify(newEncryptedData, null, 2),
            );

            // Delete old file
            await fs.promises.unlink(oldPath);
            return true;
          } catch (encryptError) {
            console.error(
              'Error handling encrypted file rename:',
              encryptError,
            );
            throw encryptError;
          }
        } else {
          // Regular file - just rename
          await fs.promises.rename(oldPath, newPath);
          return true;
        }
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

  // Update config file
  ipcMain.handle('fs-update-config', async (event, updates: any) => {
    try {
      const success = await updateConfigFile(updates);
      return success;
    } catch (error) {
      console.error('Error updating config:', error);
      return false;
    }
  });

  // Get default notes directory
  ipcMain.handle('fs-get-default-notes-directory', async () => {
    try {
      const config = await readConfigFile();
      const configDefaultPath = config?.defaultPath;

      let baseDefault = '';
      if (configDefaultPath && configDefaultPath.trim() !== '') {
        baseDefault = configDefaultPath;
      } else if (process.platform === 'win32') {
        baseDefault = process.env.USERPROFILE || process.cwd();
      } else {
        baseDefault = process.env.HOME || process.cwd();
      }

      // Append 'notes' folder
      const notesPath = path.join(baseDefault, 'notes');
      return notesPath;
    } catch (error) {
      console.error('Error getting default notes directory:', error);
      const fallback = path.join(process.cwd(), 'notes');
      return fallback;
    }
  });

  // Decrypt file and save as new file with _decrypted suffix
  ipcMain.handle('fs-decrypt-file', async (event, filePath: string) => {
    try {
      // Read the encrypted file
      const fileContent = await fs.promises.readFile(filePath, 'utf8');

      // Check if file is encrypted
      if (!managedEncryptionService.isContentEncrypted(fileContent)) {
        return {
          success: false,
          error: 'File is not encrypted',
        };
      }

      try {
        // Parse encrypted data
        const encryptedData = JSON.parse(fileContent);

        // Decrypt content
        const decryptedContent = await managedEncryptionService.decryptContent(
          encryptedData,
          filePath,
        );

        // Get original extension
        const originalExtension = encryptedData.originalExtension || '.txt';

        // Generate output filename with _decrypted suffix
        const parsed = path.parse(filePath);
        const decryptedFileName = `${parsed.name}_decrypted${originalExtension}`;
        const decryptedFilePath = path.join(parsed.dir, decryptedFileName);

        // Save decrypted content
        await fs.promises.writeFile(
          decryptedFilePath,
          decryptedContent,
          'utf8',
        );

        return {
          success: true,
          filePath: decryptedFilePath,
          fileName: decryptedFileName,
        };
      } catch (decryptError) {
        console.error('Error decrypting file:', decryptError);
        return {
          success: false,
          error: `Failed to decrypt file: ${String(decryptError)}`,
        };
      }
    } catch (error) {
      console.error('Error processing file:', error);
      return {
        success: false,
        error: String(error),
      };
    }
  });

  // System utilities
  ipcMain.handle('system:get-path-separator', async () => {
    try {
      return { success: true, data: path.sep };
    } catch (error) {
      console.error('Error getting path separator:', error);
      return { success: false, error: String(error) };
    }
  });
}
