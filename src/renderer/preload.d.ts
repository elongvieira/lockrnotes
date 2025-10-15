import { ElectronHandler } from '../main/preload';
import type { EncryptionAPI } from '../main/preload/encryptionApi';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    electron: ElectronHandler;
    encryptionAPI: EncryptionAPI;
  }
}

export {};
