import { ElectronHandler } from '../main/preload';
import type { EncryptionAPI } from '../main/preload/encryptionApi';
import type { ManualEncryptionAPI } from '../main/preload/manualEncryptionApi';
import type { exportApi } from '../main/preload/exportApi';
import type { importApi } from '../main/preload/importApi';
import type { hotCopyApi } from '../main/preload/hotcopyApi';
import type { SshAPI } from '../main/preload/sshApi';
import type { RdpAPI } from '../main/preload/rdpApi';
import type { CommunityAuthAPI } from '../main/preload/communityAuthApi';
import type { CommunityAdminAPI } from '../main/preload/communityAdminApi';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    electron: ElectronHandler;
    encryptionAPI: EncryptionAPI;
    manualEncryptionAPI: ManualEncryptionAPI;
    exportAPI: typeof exportApi;
    importAPI: typeof importApi;
    hotCopyAPI: typeof hotCopyApi;
    sshAPI: SshAPI;
    rdpAPI: RdpAPI;
    communityAuthAPI: CommunityAuthAPI;
    communityAdminAPI: CommunityAdminAPI;
  }

  namespace NodeJS {
    interface ProcessEnv {
      APP_VERSION?: string;
      NODE_ENV: 'development' | 'production';
    }
  }
}

export {};
