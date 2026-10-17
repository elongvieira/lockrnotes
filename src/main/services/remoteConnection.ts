import net from 'net';

const HOSTNAME =
  /^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)(?:\.(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?))*$/;

const ACCOUNT = /^[a-zA-Z0-9][a-zA-Z0-9._@-]{0,127}$/;

export interface RemoteTarget {
  host: string;
  port: number;
  user: string;
  password: string;
  domain?: string;
}

export function normalizeHost(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const host = raw.trim();
  if (!host || host.length > 253) return null;
  if (net.isIP(host) !== 0) return host;
  if (!HOSTNAME.test(host)) return null;
  return host;
}

export function normalizePort(raw: unknown, fallback: number): number | null {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const port = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  return port;
}

function normalizeAccount(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if (!ACCOUNT.test(value)) return null;
  return value;
}

function normalizeSecret(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  if (raw.length === 0 || raw.length > 1024) return null;
  if (raw.includes('\0') || raw.includes('\n') || raw.includes('\r')) {
    return null;
  }
  return raw;
}

/**
 * Accept only a hostname or IP, a numeric port, and an account name.
 * Passwords may contain spaces and symbols, but not newlines.
 */
export function parseRemoteTarget(
  input: {
    host?: unknown;
    port?: unknown;
    user?: unknown;
    password?: unknown;
    domain?: unknown;
  },
  defaultPort: number,
): RemoteTarget | null {
  const host = normalizeHost(input.host);
  const port = normalizePort(input.port, defaultPort);
  const user = normalizeAccount(input.user);
  const password = normalizeSecret(input.password);
  if (!host || port === null || !user || password === null) return null;

  let domain: string | undefined;
  if (
    input.domain !== undefined &&
    input.domain !== null &&
    input.domain !== ''
  ) {
    const normalized = normalizeAccount(input.domain);
    if (!normalized) return null;
    domain = normalized;
  }

  return { host, port, user, password, domain };
}

export function formatEndpoint(host: string, port: number): string {
  if (net.isIP(host) === 6) return `[${host}]:${port}`;
  return `${host}:${port}`;
}

export function windowsCredentialTarget(
  host: string,
  port: number,
  defaultPort: number,
): string {
  if (port === defaultPort) {
    const bare = net.isIP(host) === 6 ? `[${host}]` : host;
    return `TERMSRV/${bare}`;
  }
  return `TERMSRV/${formatEndpoint(host, port)}`;
}

export function windowsUsername(user: string, domain?: string): string {
  return domain ? `${domain}\\${user}` : user;
}

export function cmdkeyStoreArgs(
  target: string,
  username: string,
  password: string,
): string[] {
  return [`/generic:${target}`, `/user:${username}`, `/pass:${password}`];
}

export function cmdkeyDeleteArgs(target: string): string[] {
  return [`/delete:${target}`];
}

/**
 * FreeRDP 3 arguments. The password is read from stdin via
 * `/from-stdin:force` and is never placed on the command line.
 * Certificate checks stay enabled.
 */
export function freeRdpArgs(target: RemoteTarget): string[] {
  const args = [
    `/v:${formatEndpoint(target.host, target.port)}`,
    `/u:${target.user}`,
    '/from-stdin:force',
  ];
  if (target.domain) {
    args.push(`/d:${target.domain}`);
  }
  return args;
}
