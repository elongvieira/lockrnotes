import { joinPath } from '../utils/pathUtil';
import { fileSystemService } from './fileSystemService';
import type {
  FileCreatorStrategy,
  FileCreationData,
} from '../types/fileCreation';

export class LocalFileCreator implements FileCreatorStrategy {
  async createFile(
    targetPath: string,
    fileData: FileCreationData,
    initialFilename: string,
    initialContent: string,
    originalExtension: string,
    getEncryptedExtension: (ext: string) => string,
  ): Promise<{
    success: boolean;
    filename?: string;
    filePath?: string;
    password?: string;
    originalExtension?: string;
  }> {
    let filename = initialFilename;
    let content = initialContent;

    if (fileData.encrypted && fileData.encryptionType === 'managed') {
      try {
        const encryptedExtension = getEncryptedExtension(originalExtension);
        filename = `${filename.replace(originalExtension, '')}${encryptedExtension}`;

        const filePath = await joinPath(targetPath, filename);

        const encryptedData = await window.encryptionAPI.encryptContent(
          content,
          filePath,
          originalExtension,
        );

        content = JSON.stringify(encryptedData, null, 2);
      } catch (error) {
        console.error('Encryption failed:', error);
        throw new Error('Failed to encrypt file');
      }
    } else if (fileData.encrypted && fileData.encryptionType === 'manual') {
      if (!fileData.password) {
        throw new Error('Password is required for manual encryption');
      }

      try {
        const encryptedExtension = getEncryptedExtension(originalExtension);
        filename = `${filename.replace(originalExtension, '')}${encryptedExtension}`;

        const result = await window.manualEncryptionAPI.encryptContent(
          content,
          fileData.password,
          originalExtension,
        );

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Encryption failed');
        }

        content = JSON.stringify(result.data, null, 2);
      } catch (error) {
        console.error('Manual encryption failed:', error);
        throw new Error('Failed to encrypt file with password');
      }
    }

    const filePath = await joinPath(targetPath, filename);
    const success = await fileSystemService.createFile(filePath, content);

    if (!success) {
      throw new Error('Failed to create file locally');
    }

    return {
      success: true,
      filename,
      filePath,
      password:
        fileData.encrypted && fileData.encryptionType === 'manual'
          ? fileData.password
          : undefined,
      originalExtension,
    };
  }
}
