import {
  isHttpUrl,
  isReplayOriginAllowed,
  normalizeWebLoginUrl,
} from '../../../main/services/webLoginUrl';

describe('normalizeWebLoginUrl', () => {
  it('returns null for empty input', () => {
    expect(normalizeWebLoginUrl('')).toBeNull();
    expect(normalizeWebLoginUrl('   ')).toBeNull();
  });

  it('prepends https when protocol is missing', () => {
    expect(normalizeWebLoginUrl('github.com/login')).toBe(
      'https://github.com/login',
    );
  });

  it('keeps http and https URLs', () => {
    expect(normalizeWebLoginUrl('https://example.com')).toBe(
      'https://example.com/',
    );
    expect(normalizeWebLoginUrl('http://localhost:3000/login')).toBe(
      'http://localhost:3000/login',
    );
  });

  it('rejects non-web protocols', () => {
    const javascriptUrl = ['javascript', ':alert(1)'].join('');
    expect(normalizeWebLoginUrl(javascriptUrl)).toBeNull();
    expect(normalizeWebLoginUrl('file:///etc/passwd')).toBeNull();
    expect(normalizeWebLoginUrl('ftp://example.com')).toBeNull();
  });
});

describe('isReplayOriginAllowed', () => {
  it('requires the recorded origin when the step has one', () => {
    expect(
      isReplayOriginAllowed(
        'https://login.example/session',
        'https://login.example',
      ),
    ).toBe(true);
    expect(
      isReplayOriginAllowed(
        'https://evil.example/phish',
        'https://login.example',
      ),
    ).toBe(false);
  });

  it('allows older macros that did not record an origin', () => {
    expect(isReplayOriginAllowed('https://anywhere.example', undefined)).toBe(
      true,
    );
  });
});

describe('isHttpUrl', () => {
  it('accepts http and https', () => {
    expect(isHttpUrl('https://example.com')).toBe(true);
    expect(isHttpUrl('http://example.com')).toBe(true);
  });

  it('rejects other protocols', () => {
    expect(isHttpUrl('file:///tmp')).toBe(false);
    expect(isHttpUrl('not a url')).toBe(false);
  });
});
