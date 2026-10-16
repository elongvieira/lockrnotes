/**
 * Normalize a user-entered site address to an http(s) URL.
 * Rejects javascript:, file:, and other non-web protocols.
 */
export function normalizeWebLoginUrl(rawUrl: string): string | null {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * A recorded step may only run on the origin it was captured on.
 * Older macros have no origin and keep their previous behavior.
 */
export function isReplayOriginAllowed(
  currentUrl: string,
  stepOrigin?: string,
): boolean {
  if (!stepOrigin) return true;
  try {
    return new URL(currentUrl).origin === stepOrigin;
  } catch {
    return false;
  }
}

export function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
