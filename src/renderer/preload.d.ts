import { ElectronHandler } from '../main/preload';
import type { EncryptionAPI } from '../main/preload/encryptionApi';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    electron: ElectronHandler;
    encryptionAPI: EncryptionAPI;
  }

  namespace NodeJS {
    interface ProcessEnv {
      APP_VERSION?: string;
      NODE_ENV: 'development' | 'production';
    }
  }
}

export {};
