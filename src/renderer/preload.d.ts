import { ElectronHandler } from '../main/preload';
import type { EncryptionAPI } from '../main/preload/encryptionApi';
import type { ManualEncryptionAPI } from '../main/preload/manualEncryptionApi';
import type { exportApi } from '../main/preload/exportApi';
import type { hotCopyApi } from '../main/preload/hotcopyApi';
import type { SshAPI } from '../main/preload/sshApi';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    electron: ElectronHandler;
    encryptionAPI: EncryptionAPI;
    manualEncryptionAPI: ManualEncryptionAPI;
    exportAPI: typeof exportApi;
    hotCopyAPI: typeof hotCopyApi;
    sshAPI: SshAPI;
  }

  namespace NodeJS {
    interface ProcessEnv {
      APP_VERSION?: string;
      NODE_ENV: 'development' | 'production';
    }
  }
}

export {};
