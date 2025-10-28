// Import the encryption API to register it
import './encryptionApi';

export { filesystemApi } from './filesystemApi';
export { windowApi } from './windowApi';
export { EncryptionAPI } from './encryptionApi';
export { systemApi } from './systemApi';
export { exportApi } from './exportApi';

// Re-export types for convenience
export type {
  FileSystemItem,
  DirectoryReadOptions,
} from '../../renderer/types/filesystem';
