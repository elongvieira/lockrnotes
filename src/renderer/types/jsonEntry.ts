/**
 * Types for structured JSON entries in .json files
 */

export type JsonEntryType = 'keyValue' | 'titlePassword' | 'titleValuePassword';

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

export type JsonEntry =
  | KeyValueEntry
  | TitlePasswordEntry
  | TitleValuePasswordEntry;

/**
 * Structure of a JSON file content
 */
export interface JsonFileContent {
  entries: JsonEntry[];
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
