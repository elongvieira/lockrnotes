import {
  FileSystemItem,
  DirectoryReadOptions,
  FileSystemService,
} from '../types/filesystem';
import { LocalFileSystemProvider } from './LocalFileSystemProvider';
import { RemoteFileSystemProvider } from './RemoteFileSystemProvider';
import { VaultFileSystemProvider } from './VaultFileSystemProvider';

class FileSystemDispatcher implements FileSystemService {
  private localProvider = new LocalFileSystemProvider();
  private remoteProvider = new RemoteFileSystemProvider();
  private vaultProvider = new VaultFileSystemProvider();

  private getProvider(path?: string): FileSystemService {
    if (path && path.startsWith('remote://')) {
      return this.remoteProvider;
    }
    if (path && path.startsWith('vault://')) {
      return this.vaultProvider;
    }
    return this.localProvider;
  }

  async readDirectory(
    path: string,
    options?: DirectoryReadOptions,
  ): Promise<FileSystemItem[]> {
    return this.getProvider(path).readDirectory(path, options);
  }

  async getItem(path: string): Promise<FileSystemItem | null> {
    return this.getProvider(path).getItem(path);
  }

  async createDirectory(path: string): Promise<boolean> {
    return this.getProvider(path).createDirectory(path);
  }

  async createFile(path: string, content?: string): Promise<boolean> {
    return this.getProvider(path).createFile(path, content);
  }

  async saveFile(path: string, content: string): Promise<boolean> {
    return this.getProvider(path).saveFile(path, content);
  }

  async saveFileWithEncryption(
    path: string,
    content: string,
    isEncrypted: boolean,
    originalExtension?: string,
  ): Promise<boolean> {
    return this.getProvider(path).saveFileWithEncryption(
      path,
      content,
      isEncrypted,
      originalExtension,
    );
  }

  async readFile(path: string): Promise<string | null> {
    return this.getProvider(path).readFile(path);
  }

  async deleteItem(path: string): Promise<boolean> {
    return this.getProvider(path).deleteItem(path);
  }

  async renameItem(oldPath: string, newPath: string): Promise<boolean> {
    return this.getProvider(oldPath).renameItem(oldPath, newPath);
  }

  async getDefaultNotesDirectory(): Promise<string> {
    return this.localProvider.getDefaultNotesDirectory();
  }

  async itemExists(dirPath: string, filename: string): Promise<boolean> {
    return this.getProvider(dirPath).itemExists(dirPath, filename);
  }

  convertToTreeItems(items: FileSystemItem[]): any[] {
    return items.map((item) => ({
      itemId: item.id,
      label: item.name,
      children: item.children
        ? this.convertToTreeItems(item.children)
        : undefined,
    }));
  }

  async readConfig(): Promise<any | null> {
    return this.localProvider.readConfig();
  }

  async updateConfig(updates: any): Promise<boolean> {
    return this.localProvider.updateConfig(updates);
  }

  async decryptFile(
    filePath: string,
  ): Promise<{ success: boolean; fileName?: string; error?: string }> {
    try {
      const result = await window.electron.filesystem.decryptFile(filePath);
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

  async copyFolderContent(
    sourceDir: string,
    destDir: string,
  ): Promise<boolean> {
    return this.getProvider(sourceDir).copyFolderContent(sourceDir, destDir);
  }
}

// Export singleton instance
export const fileSystemService = new FileSystemDispatcher();
export default fileSystemService;
