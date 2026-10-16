/** Linux without a keyring falls back to a fixed key. Windows DPAPI and macOS Keychain do not. */
export function isWeakOsEncryption(backend: string): boolean {
  return backend === 'basic_text';
}
