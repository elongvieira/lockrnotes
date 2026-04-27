export interface FileSystemItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  size?: number;
  lastModified?: Date;
  children?: FileSystemItem[];
}

export interface DirectoryReadOptions {
  recursive?: boolean;
  includeHidden?: boolean;
  extensions?: string[];
}

export interface FileSystemService {
  readDirectory(
    path: string,
    options?: DirectoryReadOptions,
  ): Promise<FileSystemItem[]>;
  getItem(path: string): Promise<FileSystemItem | null>;
  createDirectory(path: string): Promise<boolean>;
  createFile(path: string, content?: string): Promise<boolean>;
  saveFile(path: string, content: string): Promise<boolean>;
  saveFileWithEncryption(
    path: string,
    content: string,
    isEncrypted: boolean,
    originalExtension?: string,
  ): Promise<boolean>;
  readFile(path: string): Promise<string | null>;
  deleteItem(path: string): Promise<boolean>;
  renameItem(oldPath: string, newPath: string): Promise<boolean>;
  itemExists(dirPath: string, filename: string): Promise<boolean>;
  readConfig(): Promise<any | null>;
  updateConfig(updates: any): Promise<boolean>;
  getDefaultNotesDirectory(): Promise<string>;
  copyFolderContent(sourceDir: string, destDir: string): Promise<boolean>;
}
