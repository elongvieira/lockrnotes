import {
  FileSystemItem,
  DirectoryReadOptions,
  FileSystemService,
} from '../types/filesystem';

export class VaultFileSystemProvider implements FileSystemService {
  private normalizeValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }

    return String(value);
  }

  /**
   * Convert the JSON content (a flat key-value object) into the
   * Record<string, string> that the Vault KV v2 API expects.
   * All values are coerced to strings; non-object / array content
   * is silently ignored so we never send garbage to Vault.
   */
  private flattenToKV(content: string): Record<string, string> {
    try {
      const parsed = JSON.parse(content) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const data: Record<string, string> = {};
        for (const [key, value] of Object.entries(
          parsed as Record<string, unknown>,
        )) {
          data[key] = this.normalizeValue(value);
        }
        return data;
      }
    } catch (error) {
      console.warn('Failed to parse Vault content before save:', error);
    }
    return {};
  }

  async readDirectory(
    _path: string,
    _options?: DirectoryReadOptions,
  ): Promise<FileSystemItem[]> {
    throw new Error('readDirectory not implemented for Vault. Use vaultAPI.');
  }

  async getItem(_path: string): Promise<FileSystemItem | null> {
    throw new Error('getItem not implemented for Vault.');
  }

  async createDirectory(_path: string): Promise<boolean> {
    return false;
  }

  async createFile(_path: string, _content?: string): Promise<boolean> {
    return false;
  }

  async saveFile(path: string, content: string): Promise<boolean> {
    try {
      // path format: vault://notes/path/to/secret
      const secretPath = path.substring(8); // strip "vault://"
      const result = await window.vaultAPI.saveSecret(
        secretPath,
        this.flattenToKV(content),
      );
      return result.success;
    } catch (error) {
      console.error('Failed to save vault secret:', error);
      return false;
    }
  }

  async saveFileWithEncryption(
    path: string,
    content: string,
    _isEncrypted: boolean,
    _originalExtension?: string,
  ): Promise<boolean> {
    // Vault secrets are not encrypted client-side; vault handles encryption
    return this.saveFile(path, content);
  }

  async readFile(path: string): Promise<string | null> {
    try {
      const secretPath = path.substring(8);
      const result = await window.vaultAPI.getSecret(secretPath);
      if (result.success && result.data) {
        // Return the raw KV object exactly as it comes from Vault.
        // No schema conversion — the editor works with the flat key-value pairs directly.
        return JSON.stringify(result.data, null, 2);
      }
      return null;
    } catch (error) {
      console.error('Failed to read vault secret:', error);
      return null;
    }
  }

  async deleteItem(path: string): Promise<boolean> {
    try {
      const secretPath = path.substring(8);
      const result = await window.vaultAPI.deleteSecret(secretPath);
      return result.success;
    } catch (error) {
      console.error('Failed to delete vault secret:', error);
      return false;
    }
  }

  async renameItem(_oldPath: string, _newPath: string): Promise<boolean> {
    return false;
  }

  async copyFolderContent(
    _sourceDir: string,
    _destDir: string,
  ): Promise<boolean> {
    return false;
  }

  async getDefaultNotesDirectory(): Promise<string> {
    return 'vault://notes/';
  }

  async itemExists(_dirPath: string, _filename: string): Promise<boolean> {
    return false;
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
    return null;
  }

  async updateConfig(_updates: any): Promise<boolean> {
    return false;
  }

  async decryptFile(
    _filePath: string,
  ): Promise<{ success: boolean; fileName?: string; error?: string }> {
    return { success: false, error: 'Not supported for Vault secrets' };
  }
}
