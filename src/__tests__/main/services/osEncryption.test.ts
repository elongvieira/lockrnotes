import { isWeakOsEncryption } from '../../../main/services/osEncryption';

describe('isWeakOsEncryption', () => {
  it('flags only the fixed-key Linux fallback', () => {
    expect(isWeakOsEncryption('basic_text')).toBe(true);
    expect(isWeakOsEncryption('dpapi')).toBe(false);
    expect(isWeakOsEncryption('keychain')).toBe(false);
    expect(isWeakOsEncryption('gnome_libsecret')).toBe(false);
  });
});
