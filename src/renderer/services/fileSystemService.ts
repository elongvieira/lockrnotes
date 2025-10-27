import {
  FileSystemItem,
  DirectoryReadOptions,
  FileSystemService,
} from '../types/filesystem';
import { joinPath } from '../utils/pathUtil';

/**
 * Service for interacting with the filesystem through Electron's IPC
 */
class FileSystemServiceImpl implements FileSystemService {
  private get fs() {
    return window.electron.filesystem;
  }

  /**
   * Read contents of a directory
   */
  async readDirectory(
    path: string,
    options?: DirectoryReadOptions,
  ): Promise<FileSystemItem[]> {
    try {
      return await this.fs.readDirectory(path, options);
    } catch (error) {
      console.error('Failed to read directory:', error);
      throw new Error(`Failed to read directory: ${path}`);
    }
  }

  /**
   * Get information about a specific file or directory
   */
  async getItem(path: string): Promise<FileSystemItem | null> {
    try {
      return await this.fs.getItem(path);
    } catch (error) {
      console.error('Failed to get item:', error);
      return null;
    }
  }

  /**
   * Create a new directory
   */
  async createDirectory(path: string): Promise<boolean> {
    try {
      return await this.fs.createDirectory(path);
    } catch (error) {
      console.error('Failed to create directory:', error);
      return false;
    }
  }

  /**
   * Create a new file
   */
  async createFile(path: string, content?: string): Promise<boolean> {
    try {
      return await this.fs.createFile(path, content);
    } catch (error) {
      console.error('Failed to create file:', error);
      return false;
    }
  }

  /**
   * Save file content
   */
  async saveFile(path: string, content: string): Promise<boolean> {
    try {
      return await this.fs.saveFile(path, content);
    } catch (error) {
      console.error('Failed to save file:', error);
      return false;
    }
  }

  /**
   * Save file content with automatic encryption if needed
   * @param path - File path
   * @param content - Content to save (plain text)
   * @param isEncrypted - Whether the file should be encrypted
   * @param originalExtension - Original file extension (needed for encryption)
   * @returns Promise<boolean> - Success status
   */
  async saveFileWithEncryption(
    path: string,
    content: string,
    isEncrypted: boolean,
    originalExtension?: string,
  ): Promise<boolean> {
    try {
      let contentToSave = content;

      // If file is encrypted, encrypt content before saving
      if (isEncrypted) {
        try {
          const originalExt = originalExtension || '.txt';
          const encryptedData = await window.encryptionAPI.encryptContent(
            content,
            path,
            originalExt,
          );
          contentToSave = JSON.stringify(encryptedData, null, 2);
        } catch (encryptError) {
          console.error('Error encrypting file:', encryptError);
          throw new Error('Encryption failed');
        }
      }

      return await this.fs.saveFile(path, contentToSave);
    } catch (error) {
      console.error('Failed to save file with encryption:', error);
      return false;
    }
  }

  /**
   * Read file content
   */
  async readFile(path: string): Promise<string | null> {
    try {
      return await this.fs.readFile(path);
    } catch (error) {
      console.error('Failed to read file:', error);
      return null;
    }
  }

  /**
   * Delete a file or directory
   */
  async deleteItem(path: string): Promise<boolean> {
    try {
      return await this.fs.deleteItem(path);
    } catch (error) {
      console.error('Failed to delete item:', error);
      return false;
    }
  }

  /**
   * Rename/move a file or directory
   */
  async renameItem(oldPath: string, newPath: string): Promise<boolean> {
    try {
      return await this.fs.renameItem(oldPath, newPath);
    } catch (error) {
      console.error('Failed to rename item:', error);
      return false;
    }
  }

  /**
   * Get default notes directory based on config or OS fallback
   * Reads `config.defaultPath` via readConfig() when available and appends `notes` folder.
   */
  async getDefaultNotesDirectory(): Promise<string> {
    try {
      const notesPath = await this.fs.getDefaultNotesDirectory();
      return notesPath;
    } catch (error) {
      console.error('Failed to get default notes directory:', error);
      throw new Error('Failed to get default notes directory');
    }
  }

  /**
   * Check whether an item exists given a directory path and filename
   */
  async itemExists(dirPath: string, filename: string): Promise<boolean> {
    try {
      const fullPath = await joinPath(dirPath, filename);
      const item = await this.getItem(fullPath);
      return !!item;
    } catch (error) {
      console.error('Failed to check item existence:', error);
      return false;
    }
  }

  /**
   * Convert FileSystemItem to TreeView format
   */
  convertToTreeItems(items: FileSystemItem[]): any[] {
    return items.map((item) => ({
      itemId: item.id,
      label: item.name,
      children: item.children
        ? this.convertToTreeItems(item.children)
        : undefined,
    }));
  }

  /**
   * Read the application config
   */
  async readConfig(): Promise<any | null> {
    try {
      return await this.fs.readConfig();
    } catch (error) {
      console.error('Failed to read config:', error);
      return null;
    }
  }

  /**
   * Update the application config
   */
  async updateConfig(updates: any): Promise<boolean> {
    try {
      return await this.fs.updateConfig(updates);
    } catch (error) {
      console.error('Failed to update config:', error);
      return false;
    }
  }

  /**
   * Decrypt an encrypted file and save as new file
   */
  async decryptFile(
    filePath: string,
  ): Promise<{ success: boolean; fileName?: string; error?: string }> {
    try {
      const result = await this.fs.decryptFile(filePath);
      return {
        success: result.success,
        fileName: result.fileName,
        error: result.error,
      };
    } catch (error) {
      console.error('Failed to decrypt file:', error);
      return {
        success: false,
        error: String(error),
      };
    }
  }
}

// Export singleton instance
export const fileSystemService = new FileSystemServiceImpl();
export default fileSystemService;
