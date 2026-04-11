import type { FileCreatorStrategy, FileCreationData } from '../types/fileCreation';

export class RemoteFileCreator implements FileCreatorStrategy {
  async createFile(
    _targetPath: string, // remote path is ignored, handled by api
    fileData: FileCreationData,
    initialFilename: string,
    initialContent: string,
    originalExtension: string,
    getEncryptedExtension: (ext: string) => string
  ): Promise<{
    success: boolean;
    filename?: string;
    filePath?: string;
    password?: string;
    originalExtension?: string;
  }> {
    let filename = initialFilename;
    let content = initialContent;

    // Determine final filename extension for encrypted file
    if (fileData.encrypted) {
      const encryptedExtension = getEncryptedExtension(originalExtension);
      filename = `${filename.replace(originalExtension, '')}${encryptedExtension}`;
    }

    // Step 1: Create empty file to get ID
    const createResult = await window.communityFilesAPI.createFile({
      name: filename,
      type: 'file',
      content: '',
      parentId: fileData.parentId
    });

    if (!createResult.success || !createResult.data || !createResult.data.id) {
      throw new Error('Failed to create file remotely: ' + (createResult.error || 'Unknown network error'));
    }

    const newId = createResult.data.id;
    const filePath = `remote://${newId}`;
    let finalContent = content;

    // Step 2: Encrypt with the new filePath as the key parameter if managed
    if (fileData.encrypted && fileData.encryptionType === 'managed') {
      const encryptedData = await window.encryptionAPI.encryptContent(
        content,
        filePath,
        originalExtension
      );
      finalContent = JSON.stringify(encryptedData, null, 2);
    } else if (fileData.encrypted && fileData.encryptionType === 'manual') {
      if (!fileData.password) throw new Error('Password required for manual encryption');
      const result = await window.manualEncryptionAPI.encryptContent(
        content,
        fileData.password,
        originalExtension
      );
      if (!result.success || !result.data) throw new Error(result.error || 'Encryption failed');
      finalContent = JSON.stringify(result.data, null, 2);
    }

    // Step 3: Update file content remotely
    const updateResult = await window.communityFilesAPI.updateFile(newId, { content: finalContent });
    if (!updateResult.success) {
      throw new Error('Failed to update remote file content');
    }

    return {
      success: true,
      filename,
      filePath,
      password: fileData.encrypted && fileData.encryptionType === 'manual' ? fileData.password : undefined,
      originalExtension
    };
  }
}
