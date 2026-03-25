export interface FileCreationData {
  filename: string;
  type: 'text' | 'keyvalue';
  encrypted: boolean;
  encryptionType?: 'managed' | 'manual';
  password?: string;
}

export interface FileTemplate {
  extension: string;
  generateContent: (filename: string, data?: any) => string;
}

export interface FileCreationService {
  createFile(
    targetPath: string,
    fileData: FileCreationData,
  ): Promise<{
    success: boolean;
    filename?: string;
    filePath?: string;
    password?: string;
    originalExtension?: string;
  }>;
  getEncryptedExtension(originalExtension: string): string;
  getAvailableTypes(): string[];
  getTemplate(type: string): FileTemplate | undefined;
  registerTemplate(type: string, template: FileTemplate): void;
  isEncryptionSupported(): boolean;
  generatePreview(filename: string, type: string): string;
}
