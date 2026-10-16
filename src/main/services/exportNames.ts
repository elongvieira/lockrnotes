import path from 'path';

/** Swap only the file extension, not a matching suffix in a parent folder name. */
export function exportEntryName(
  relativePath: string,
  originalExtension: string,
): string {
  const parsed = path.parse(relativePath);
  const extension = originalExtension.startsWith('.')
    ? originalExtension
    : `.${originalExtension}`;
  return path.join(parsed.dir, `${parsed.name}${extension}`);
}
