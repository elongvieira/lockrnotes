import crypto from 'crypto';

export interface KnownHostStore {
  [endpoint: string]: string;
}

export function hostKeyFingerprint(key: Buffer): string {
  const digest = crypto.createHash('sha256').update(key).digest('base64');
  return `SHA256:${digest.replace(/=+$/, '')}`;
}

export function hostEndpoint(host: string, port: number): string {
  return `${host}:${port}`;
}

/** First sight of a key is trusted. A different key needs an explicit decision. */
export function classifyHostKey(
  store: KnownHostStore,
  endpoint: string,
  fingerprint: string,
): 'new' | 'match' | 'mismatch' {
  const current = store[endpoint];
  if (!current) return 'new';
  if (current === fingerprint) return 'match';
  return 'mismatch';
}
