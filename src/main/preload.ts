// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge } from 'electron';
import { filesystemApi, windowApi, systemApi } from './preload/index';
import './preload/encryptionApi';

const electronHandler = {
  // Window controls exposed for a frameless window
  window: windowApi,
  // Filesystem API exposed to renderer
  filesystem: filesystemApi,
  // System utilities
  system: systemApi,
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
