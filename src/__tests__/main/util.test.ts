import path from 'path';
import {
  resolveHtmlPath,
  getPathSeparator,
  isAllowedAppNavigation,
  isAllowedExternalUrl,
} from '../../main/util';

describe('getPathSeparator', () => {
  it('should return the system path separator', () => {
    const sep = getPathSeparator();
    expect(sep).toBe(path.sep);
  });

  it('should return a single character', () => {
    expect(getPathSeparator()).toHaveLength(1);
  });
});

describe('resolveHtmlPath', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should return localhost URL in development', () => {
    process.env.NODE_ENV = 'development';
    const result = resolveHtmlPath('index.html');
    expect(result).toMatch(/^http:\/\/localhost:\d+\/index\.html$/);
  });

  it('should use port 1212 by default in development', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.PORT;
    const result = resolveHtmlPath('index.html');
    expect(result).toContain('1212');
  });

  it('should use custom PORT env var in development', () => {
    process.env.NODE_ENV = 'development';
    process.env.PORT = '3000';
    const result = resolveHtmlPath('index.html');
    expect(result).toContain('3000');
    delete process.env.PORT;
  });

  it('should return file:// URL in production', () => {
    process.env.NODE_ENV = 'production';
    const result = resolveHtmlPath('index.html');
    expect(result).toMatch(/^file:\/\//);
    expect(result).toContain('index.html');
  });
});

describe('isAllowedAppNavigation', () => {
  const devApp = 'http://localhost:1212/index.html';
  const fileApp = 'file:///C:/app/renderer/index.html';

  it('allows the dev server origin and same-folder file urls', () => {
    expect(
      isAllowedAppNavigation('http://localhost:1212/index.html', devApp),
    ).toBe(true);
    expect(
      isAllowedAppNavigation('file:///C:/app/renderer/index.html', fileApp),
    ).toBe(true);
  });

  it('rejects other origins and dropped files', () => {
    expect(isAllowedAppNavigation('https://evil.example/phish', devApp)).toBe(
      false,
    );
    expect(isAllowedAppNavigation('file:///C:/Users/note.html', devApp)).toBe(
      false,
    );
    expect(isAllowedAppNavigation('file:///C:/Users/note.html', fileApp)).toBe(
      false,
    );
    expect(isAllowedAppNavigation('not a url', devApp)).toBe(false);
  });
});

describe('isAllowedExternalUrl', () => {
  it('allows only http and https', () => {
    expect(
      isAllowedExternalUrl('https://github.com/elongvieira/lockrnotes'),
    ).toBe(true);
    expect(isAllowedExternalUrl('http://example.com')).toBe(true);
    expect(isAllowedExternalUrl('file:///C:/Windows/system32')).toBe(false);
    expect(isAllowedExternalUrl('ms-msdt:id')).toBe(false);
    expect(isAllowedExternalUrl('data:text/html,hi')).toBe(false);
  });
});
