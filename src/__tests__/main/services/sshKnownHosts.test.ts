import {
  classifyHostKey,
  hostEndpoint,
  hostKeyFingerprint,
} from '../../../main/services/sshHostKey';

describe('ssh known hosts', () => {
  const key = Buffer.from('server-host-key');

  it('builds a stable SHA256 fingerprint', () => {
    const fingerprint = hostKeyFingerprint(key);
    expect(fingerprint.startsWith('SHA256:')).toBe(true);
    expect(hostKeyFingerprint(key)).toBe(fingerprint);
    expect(hostKeyFingerprint(Buffer.from('other'))).not.toBe(fingerprint);
  });

  it('trusts the first key and flags a replacement', () => {
    const endpoint = hostEndpoint('db.internal', 22);
    const fingerprint = hostKeyFingerprint(key);
    expect(classifyHostKey({}, endpoint, fingerprint)).toBe('new');
    expect(
      classifyHostKey({ [endpoint]: fingerprint }, endpoint, fingerprint),
    ).toBe('match');
    expect(
      classifyHostKey({ [endpoint]: 'SHA256:old' }, endpoint, fingerprint),
    ).toBe('mismatch');
  });
});
