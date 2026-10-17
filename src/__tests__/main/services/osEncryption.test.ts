import {
  isWeakOsEncryption,
  readOsEncryptionStatus,
} from '../../../main/services/osEncryption';

describe('isWeakOsEncryption', () => {
  it('flags only the fixed-key Linux fallback', () => {
    expect(isWeakOsEncryption('basic_text')).toBe(true);
    expect(isWeakOsEncryption('dpapi')).toBe(false);
    expect(isWeakOsEncryption('keychain')).toBe(false);
    expect(isWeakOsEncryption('gnome_libsecret')).toBe(false);
  });
});

describe('readOsEncryptionStatus', () => {
  it('treats Windows and macOS as protected when the Linux API is absent', () => {
    expect(readOsEncryptionStatus({}, 'win32')).toEqual({
      backend: 'win32',
      weak: false,
    });
  });

  it('reads the Linux backend when the method exists', () => {
    const storage = { getSelectedStorageBackend: () => 'basic_text' };
    expect(readOsEncryptionStatus(storage, 'linux')).toEqual({
      backend: 'basic_text',
      weak: true,
    });
  });
});
