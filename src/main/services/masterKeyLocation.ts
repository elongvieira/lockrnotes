import path from 'path';

export const MASTER_KEY_FILE = '.lockrnotes_key';

const MANAGED_TYPE = /"type"\s*:\s*"lockrnotes-encrypted"/;

export function resolveMasterKeyPath(options: {
  storageType: 'system' | 'folder';
  defaultPath?: string;
  userDataPath: string;
}): string {
  if (options.storageType === 'folder' && options.defaultPath) {
    return path.join(options.defaultPath, '.lockrnotes', MASTER_KEY_FILE);
  }
  return path.join(options.userDataPath, 'encryption', MASTER_KEY_FILE);
}

/** True when a file header belongs to managed encryption, not a password file. */
export function headerLooksManaged(header: string): boolean {
  return MANAGED_TYPE.test(header);
}
