import {
  FileSystemItem,
  DirectoryReadOptions,
  FileSystemService,
} from '../types/filesystem';
import { joinPath } from '../utils/pathUtil';

export class LocalFileSystemProvider implements FileSystemService {
  private get fs() {
    return window.electron.filesystem;
  }

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

  async getItem(path: string): Promise<FileSystemItem | null> {
    try {
      return await this.fs.getItem(path);
    } catch (error) {
      console.error('Failed to get item:', error);
      return null;
    }
  }

  async createDirectory(path: string): Promise<boolean> {
    try {
      return await this.fs.createDirectory(path);
    } catch (error) {
      console.error('Failed to create directory:', error);
      return false;
    }
  }

  async createFile(path: string, content?: string): Promise<boolean> {
    try {
      return await this.fs.createFile(path, content);
    } catch (error) {
      console.error('Failed to create file:', error);
      return false;
    }
  }

  async saveFile(path: string, content: string): Promise<boolean> {
    try {
      return await this.fs.saveFile(path, content);
    } catch (error) {
      console.error('Failed to save file:', error);
      return false;
    }
  }

  async saveFileWithEncryption(
    path: string,
    content: string,
    isEncrypted: boolean,
    originalExtension?: string,
  ): Promise<boolean> {
    try {
      let contentToSave = content;

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

  async readFile(path: string): Promise<string | null> {
    try {
      return await this.fs.readFile(path);
    } catch (error) {
      console.error('Failed to read file:', error);
      return null;
    }
  }

  async deleteItem(path: string): Promise<boolean> {
    try {
      return await this.fs.deleteItem(path);
    } catch (error) {
      console.error('Failed to delete item:', error);
      return false;
    }
  }

  async renameItem(oldPath: string, newPath: string): Promise<boolean> {
    try {
      return await this.fs.renameItem(oldPath, newPath);
    } catch (error) {
      console.error('Failed to rename item:', error);
      return false;
    }
  }

  async getDefaultNotesDirectory(): Promise<string> {
    try {
      const notesPath = await this.fs.getDefaultNotesDirectory();
      return notesPath;
    } catch (error) {
      console.error('Failed to get default notes directory:', error);
      throw new Error('Failed to get default notes directory');
    }
  }

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

  async readConfig(): Promise<any | null> {
    try {
      return await this.fs.readConfig();
    } catch (error) {
      console.error('Failed to read config:', error);
      return null;
    }
  }

  async updateConfig(updates: any): Promise<boolean> {
    try {
      return await this.fs.updateConfig(updates);
    } catch (error) {
      console.error('Failed to update config:', error);
      return false;
    }
  }

  async copyFolderContent(
    sourceDir: string,
    destDir: string,
  ): Promise<boolean> {
    try {
      const result = await this.fs.copyDirectory(sourceDir, destDir);
      return result.success;
    } catch (error) {
      console.error('Failed to copy folder:', error);
      return false;
    }
  }
}
