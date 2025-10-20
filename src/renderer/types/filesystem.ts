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
  deleteItem(path: string): Promise<boolean>;
  renameItem(oldPath: string, newPath: string): Promise<boolean>;
  getDefaultNotesDirectory(): Promise<string>;
}
