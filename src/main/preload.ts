// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge } from 'electron';
import {
  filesystemApi,
  windowApi,
  systemApi,
  exportApi,
  importApi,
} from './preload/index';
import { hotCopyApi } from './preload/hotcopyApi';
import { sshApi } from './preload/sshApi';
import { rdpApi } from './preload/rdpApi';
import { communityAuthApi } from './preload/communityAuthApi';
import { communityAdminApi } from './preload/communityAdminApi';
import { communityFilesApi } from './preload/communityFilesApi';
import './preload/encryptionApi';
import './preload/manualEncryptionApi';

const electronHandler = {
  // Window controls exposed for a frameless window
  window: windowApi,
  // Filesystem API exposed to renderer
  filesystem: filesystemApi,
  // System utilities
  system: systemApi,
};

contextBridge.exposeInMainWorld('electron', electronHandler);
contextBridge.exposeInMainWorld('exportAPI', exportApi);
contextBridge.exposeInMainWorld('importAPI', importApi);
contextBridge.exposeInMainWorld('hotCopyAPI', hotCopyApi);
contextBridge.exposeInMainWorld('sshAPI', sshApi);
contextBridge.exposeInMainWorld('rdpAPI', rdpApi);
contextBridge.exposeInMainWorld('communityAuthAPI', communityAuthApi);
contextBridge.exposeInMainWorld('communityAdminAPI', communityAdminApi);
contextBridge.exposeInMainWorld('communityFilesAPI', communityFilesApi);

export type ElectronHandler = typeof electronHandler;
