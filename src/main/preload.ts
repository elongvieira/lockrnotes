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
import { webLoginApi } from './preload/webLoginApi';
import { customLoginApi } from './preload/customLoginApi';
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
contextBridge.exposeInMainWorld('webLoginAPI', webLoginApi);
contextBridge.exposeInMainWorld('customLoginAPI', customLoginApi);

export type ElectronHandler = typeof electronHandler;
