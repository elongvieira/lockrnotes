/** Linux without a keyring falls back to a fixed key. Windows DPAPI and macOS Keychain do not. */
export function isWeakOsEncryption(backend: string): boolean {
  return backend === 'basic_text';
}

/**
 * `getSelectedStorageBackend` exists only on Linux. On Windows and macOS the
 * OS store is always used, so a missing method is not a weak backend.
 */
export function readOsEncryptionStatus(
  storage: { getSelectedStorageBackend?: () => string },
  platform: string,
): { backend: string; weak: boolean } {
  const readBackend = storage.getSelectedStorageBackend;
  if (typeof readBackend !== 'function') {
    return { backend: platform, weak: false };
  }
  const backend = readBackend.call(storage);
  return { backend, weak: isWeakOsEncryption(backend) };
}
