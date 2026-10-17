import {
  cmdkeyDeleteArgs,
  cmdkeyStoreArgs,
  formatEndpoint,
  freeRdpArgs,
  normalizeHost,
  normalizePort,
  parseRemoteTarget,
  windowsCredentialTarget,
  windowsUsername,
} from '../../../main/services/remoteConnection';

describe('normalizeHost', () => {
  it('accepts hostnames and IP addresses', () => {
    expect(normalizeHost('db.internal')).toBe('db.internal');
    expect(normalizeHost('localhost')).toBe('localhost');
    expect(normalizeHost(' 10.0.0.8 ')).toBe('10.0.0.8');
    expect(normalizeHost('::1')).toBe('::1');
  });

  it('rejects shell metacharacters and empty values', () => {
    expect(normalizeHost('host & calc.exe')).toBeNull();
    expect(normalizeHost('host;id')).toBeNull();
    expect(normalizeHost('host|whoami')).toBeNull();
    expect(normalizeHost('../etc')).toBeNull();
    expect(normalizeHost('')).toBeNull();
    expect(normalizeHost(undefined)).toBeNull();
  });
});

describe('normalizePort', () => {
  it('uses the fallback when the port is omitted', () => {
    expect(normalizePort(undefined, 3389)).toBe(3389);
    expect(normalizePort('', 22)).toBe(22);
  });

  it('rejects ports outside 1-65535', () => {
    expect(normalizePort(0, 22)).toBeNull();
    expect(normalizePort(65536, 22)).toBeNull();
    expect(normalizePort('abc', 22)).toBeNull();
    expect(normalizePort(22.5, 22)).toBeNull();
  });
});

describe('parseRemoteTarget', () => {
  it('returns a normalized target', () => {
    expect(
      parseRemoteTarget(
        { host: 'srv', user: 'admin', password: 'p@ss word' },
        3389,
      ),
    ).toEqual({
      host: 'srv',
      port: 3389,
      user: 'admin',
      password: 'p@ss word',
    });
  });

  it('rejects a domain or password that could break the launcher', () => {
    expect(
      parseRemoteTarget(
        { host: 'srv', user: 'admin', password: 'a\nb', domain: 'CORP' },
        3389,
      ),
    ).toBeNull();
    expect(
      parseRemoteTarget(
        { host: 'srv', user: 'admin', password: 'secret', domain: 'CORP\\..' },
        3389,
      ),
    ).toBeNull();
  });
});

describe('launcher arguments', () => {
  const target = {
    host: '10.1.1.5',
    port: 3390,
    user: 'alice',
    password: 's3cret&whoami',
    domain: 'CORP',
  };

  it('keeps the password out of the FreeRDP argument list', () => {
    const args = freeRdpArgs(target);
    expect(args).toEqual([
      '/v:10.1.1.5:3390',
      '/u:alice',
      '/from-stdin:force',
      '/d:CORP',
    ]);
    expect(args.join(' ')).not.toContain('s3cret');
    expect(args.join(' ')).not.toContain('cert');
  });

  it('passes cmdkey switches as separate arguments', () => {
    const stored = windowsCredentialTarget('10.1.1.5', 3390, 3389);
    expect(stored).toBe('TERMSRV/10.1.1.5:3390');
    expect(windowsUsername('alice', 'CORP')).toBe('CORP\\alice');
    expect(cmdkeyStoreArgs(stored, 'CORP\\alice', target.password)).toEqual([
      '/generic:TERMSRV/10.1.1.5:3390',
      '/user:CORP\\alice',
      '/pass:s3cret&whoami',
    ]);
    expect(cmdkeyDeleteArgs(stored)).toEqual(['/delete:TERMSRV/10.1.1.5:3390']);
  });

  it('brackets IPv6 endpoints', () => {
    expect(formatEndpoint('::1', 22)).toBe('[::1]:22');
    expect(windowsCredentialTarget('::1', 3389, 3389)).toBe('TERMSRV/[::1]');
  });
});
