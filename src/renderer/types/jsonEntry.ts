/**
 * Types for structured JSON entries in .json files
 */

export type JsonEntryType =
  | 'keyValue'
  | 'titleTwoValues'
  | 'titlePassword'
  | 'titleValuePassword'
  | 'titleTwoValuesPassword'
  | 'ssh'
  | 'rdp'
  | 'webLogin'
  | 'customLogin';

export interface BaseEntry {
  id: string;
  type: JsonEntryType;
}

/**
 * Simple key-value entry (título + valor)
 */
export interface KeyValueEntry extends BaseEntry {
  type: 'keyValue';
  title: string;
  value: string;
}

/**
 * Title with two values (título + valor 1 + valor 2)
 * Example: Server name, username, URL
 */
export interface TitleTwoValuesEntry extends BaseEntry {
  type: 'titleTwoValues';
  title: string;
  value1: string;
  value2: string;
}

/**
 * Title with password (título + senha)
 */
export interface TitlePasswordEntry extends BaseEntry {
  type: 'titlePassword';
  title: string;
  password: string;
}

/**
 * Title with value and password (título + valor + senha)
 * Example: Server name, URL, password
 */
export interface TitleValuePasswordEntry extends BaseEntry {
  type: 'titleValuePassword';
  title: string;
  value: string;
  password: string;
}

/**
 * Title with two values and password (título + valor 1 + valor 2 + senha)
 * Example: Server name, username, key, password
 */
export interface TitleTwoValuesPasswordEntry extends BaseEntry {
  type: 'titleTwoValuesPassword';
  title: string;
  value1: string;
  value2: string;
  password: string;
}

/**
 * SSH entry (title + host + user + password)
 */
export interface SshEntry extends BaseEntry {
  type: 'ssh';
  title: string;
  host: string;
  port?: number;
  user: string;
  password: string;
}

/**
 * RDP entry (title + host + user + password + domain + port)
 */
export interface RdpEntry extends BaseEntry {
  type: 'rdp';
  title: string;
  host: string;
  port?: number;
  user: string;
  password: string;
  domain?: string;
}

/**
 * Web login entry (site name + URL + login + password)
 */
export interface WebLoginEntry extends BaseEntry {
  type: 'webLogin';
  title: string;
  url: string;
  user: string;
  password: string;
  shareSession?: boolean;
  sessionId?: string;
}

export type CustomLoginClickStep = {
  id: string;
  kind: 'click';
  label: string;
  selector: string;
  text?: string;
};

export type CustomLoginTypeStep = {
  id: string;
  kind: 'type';
  label: string;
  selector: string;
  value: string;
  isPassword?: boolean;
};

export type CustomLoginStep = CustomLoginClickStep | CustomLoginTypeStep;

/**
 * Custom login entry driven by a recorded macro (clicks + typed fields)
 */
export interface CustomLoginEntry extends BaseEntry {
  type: 'customLogin';
  title: string;
  url: string;
  steps: CustomLoginStep[];
  shareSession?: boolean;
  sessionId?: string;
}

export type JsonEntry =
  | KeyValueEntry
  | TitleTwoValuesEntry
  | TitlePasswordEntry
  | TitleValuePasswordEntry
  | TitleTwoValuesPasswordEntry
  | SshEntry
  | RdpEntry
  | WebLoginEntry
  | CustomLoginEntry;

/**
 * Structure of a JSON file content
 */
export interface JsonFileContent {
  entries: JsonEntry[];
}

/**
 * Stable id used as the isolated browser-session partition for a login entry.
 */
export function createLoginSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function loginSessionOptions(entry: {
  id: string;
  shareSession?: boolean;
  sessionId?: string;
}): { shareSession: boolean; sessionId: string } {
  return {
    shareSession: Boolean(entry.shareSession),
    sessionId: entry.sessionId || entry.id,
  };
}

/**
 * Helper to create a new entry with a unique ID
 */
export function createEntry(
  type: JsonEntryType,
  data: Partial<JsonEntry>,
): JsonEntry {
  const id = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  switch (type) {
    case 'keyValue':
      return {
        id,
        type: 'keyValue',
        title: (data as KeyValueEntry).title || '',
        value: (data as KeyValueEntry).value || '',
      };
    case 'titleTwoValues':
      return {
        id,
        type: 'titleTwoValues',
        title: (data as TitleTwoValuesEntry).title || '',
        value1: (data as TitleTwoValuesEntry).value1 || '',
        value2: (data as TitleTwoValuesEntry).value2 || '',
      };
    case 'titlePassword':
      return {
        id,
        type: 'titlePassword',
        title: (data as TitlePasswordEntry).title || '',
        password: (data as TitlePasswordEntry).password || '',
      };
    case 'titleValuePassword':
      return {
        id,
        type: 'titleValuePassword',
        title: (data as TitleValuePasswordEntry).title || '',
        value: (data as TitleValuePasswordEntry).value || '',
        password: (data as TitleValuePasswordEntry).password || '',
      };
    case 'titleTwoValuesPassword':
      return {
        id,
        type: 'titleTwoValuesPassword',
        title: (data as TitleTwoValuesPasswordEntry).title || '',
        value1: (data as TitleTwoValuesPasswordEntry).value1 || '',
        value2: (data as TitleTwoValuesPasswordEntry).value2 || '',
        password: (data as TitleTwoValuesPasswordEntry).password || '',
      };
    case 'ssh':
      return {
        id,
        type: 'ssh',
        title: (data as SshEntry).title || '',
        host: (data as SshEntry).host || '',
        port: (data as SshEntry).port || 22,
        user: (data as SshEntry).user || '',
        password: (data as SshEntry).password || '',
      };
    case 'rdp':
      return {
        id,
        type: 'rdp',
        title: (data as RdpEntry).title || '',
        host: (data as RdpEntry).host || '',
        port: (data as RdpEntry).port || 3389,
        user: (data as RdpEntry).user || '',
        password: (data as RdpEntry).password || '',
        domain: (data as RdpEntry).domain || '',
      };
    case 'webLogin':
      return {
        id,
        type: 'webLogin',
        title: (data as WebLoginEntry).title || '',
        url: (data as WebLoginEntry).url || '',
        user: (data as WebLoginEntry).user || '',
        password: (data as WebLoginEntry).password || '',
        shareSession: Boolean((data as WebLoginEntry).shareSession),
        sessionId: (data as WebLoginEntry).sessionId || createLoginSessionId(),
      };
    case 'customLogin':
      return {
        id,
        type: 'customLogin',
        title: (data as CustomLoginEntry).title || '',
        url: (data as CustomLoginEntry).url || '',
        steps: Array.isArray((data as CustomLoginEntry).steps)
          ? (data as CustomLoginEntry).steps
          : [],
        shareSession: Boolean((data as CustomLoginEntry).shareSession),
        sessionId:
          (data as CustomLoginEntry).sessionId || createLoginSessionId(),
      };
    default:
      throw new Error(`Unknown entry type: ${type}`);
  }
}

/**
 * Parse JSON string to structured entries
 */
export function parseJsonContent(content: string): JsonEntry[] {
  try {
    const parsed = JSON.parse(content);
    if (parsed && Array.isArray(parsed.entries)) {
      return parsed.entries;
    }
    // If old format or empty, return empty array
    return [];
  } catch (error) {
    console.error('Failed to parse JSON content:', error);
    return [];
  }
}

/**
 * Serialize entries back to JSON string
 */
export function serializeJsonContent(entries: JsonEntry[]): string {
  const content: JsonFileContent = { entries };
  return JSON.stringify(content, null, 2);
}
