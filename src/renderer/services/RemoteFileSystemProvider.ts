import {
  FileSystemItem,
  DirectoryReadOptions,
  FileSystemService,
} from '../types/filesystem';

export class RemoteFileSystemProvider implements FileSystemService {
  async readDirectory(
    _path: string,
    _options?: DirectoryReadOptions,
  ): Promise<FileSystemItem[]> {
    throw new Error('readDirectory not implemented directly for Remote. Use communityFilesAPI.');
  }

  async getItem(_path: string): Promise<FileSystemItem | null> {
    throw new Error('getItem not implemented directly for Remote.');
  }

  async createDirectory(_path: string): Promise<boolean> {
    return false;
  }

  async createFile(_path: string, _content?: string): Promise<boolean> {
    return false;
  }

  async saveFile(path: string, content: string): Promise<boolean> {
    try {
      const fileId = path.substring(9);
      const result = await window.communityFilesAPI.updateFile(fileId, { content });
      return result.success;
    } catch (error) {
      console.error('Failed to save remote file:', error);
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

      const fileId = path.substring(9);
      const result = await window.communityFilesAPI.updateFile(fileId, { content: contentToSave });
      return result.success;
    } catch (error) {
      console.error('Failed to save remote file with encryption:', error);
      return false;
    }
  }

  async readFile(path: string): Promise<string | null> {
    try {
      const fileId = path.substring(9);
      const result = await window.communityFilesAPI.getFile(fileId);
      if (result.success && result.data && result.data.content) {
        return result.data.content;
      }
      return null;
    } catch (error) {
      console.error('Failed to read remote file:', error);
      return null;
    }
  }

  async deleteItem(_path: string): Promise<boolean> {
    return false;
  }

  async renameItem(_oldPath: string, _newPath: string): Promise<boolean> {
    return false;
  }

  async getDefaultNotesDirectory(): Promise<string> {
    return 'remote://';
  }

  async itemExists(_dirPath: string, _filename: string): Promise<boolean> {
    return false;
  }

  async readConfig(): Promise<any | null> {
    return null;
  }

  async updateConfig(_updates: any): Promise<boolean> {
    return false;
  }

  async copyFolderContent(
    _sourceDir: string,
    _destDir: string,
  ): Promise<boolean> {
    return false;
  }
}
