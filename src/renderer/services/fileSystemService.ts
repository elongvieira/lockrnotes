import {
  FileSystemItem,
  DirectoryReadOptions,
  FileSystemService,
} from '../types/filesystem';

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
   * Get default notes directory based on OS
   */
  getDefaultNotesDirectory(): string {
    // You can customize this based on your app's needs
    const userHome = process.env.HOME || process.env.USERPROFILE || '';
    return `${userHome}/Documents/LockrNotes`;
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
}

// Export singleton instance
export const fileSystemService = new FileSystemServiceImpl();
export default fileSystemService;
