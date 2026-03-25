export interface HotCopyItem {
  id: string; // unique identifier
  filePath: string; // absolute path to the JSON file
  entryIndex: number; // index (0-based) in entries array
  fieldName: string; // field name to copy (e.g., "value", "value1", "password")
  label?: string; // optional custom label
  position: number; // slot position 1-5
  value?: string; // cached value (will be fetched dynamically)
}

export interface HotCopyConfig {
  items: HotCopyItem[];
}
