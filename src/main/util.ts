/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

/**
 * Retorna o separador de path do sistema operacional atual.
 * Em Windows retorna '\\', em sistemas POSIX retorna '/'.
 */
export function getPathSeparator(): string {
  return path.sep;
}

/**
 * Navigation is limited to the app document: the dev server origin, or the
 * packaged renderer directory. Dropped files and remote pages are rejected.
 */
export function isAllowedAppNavigation(
  targetUrl: string,
  appUrl: string,
): boolean {
  try {
    const target = new URL(targetUrl);
    const app = new URL(appUrl);
    if (app.protocol === 'http:' || app.protocol === 'https:') {
      return target.origin === app.origin;
    }
    if (app.protocol !== 'file:' || target.protocol !== 'file:') {
      return false;
    }
    const appDir = app.pathname.slice(0, app.pathname.lastIndexOf('/') + 1);
    return target.pathname.startsWith(appDir);
  } catch {
    return false;
  }
}

/** External links opened from the app are limited to web URLs. */
export function isAllowedExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
