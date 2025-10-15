export { filesystemApi } from './filesystemApi';
export { windowApi } from './windowApi';
export { EncryptionAPI } from './encryptionApi';

// Import the encryption API to register it
import './encryptionApi';

// Re-export types for convenience
export type {
  FileSystemItem,
  DirectoryReadOptions,
} from '../../renderer/types/filesystem';
