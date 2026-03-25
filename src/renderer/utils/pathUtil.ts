/**
 * Small helper to join path segments using the platform separator exposed by preload.
 * This is async because it queries the main process for the separator.
 */
export async function joinPath(
  ...segments: Array<string | undefined | null>
): Promise<string> {
  const cleaned = segments.filter(Boolean).map((s) => String(s));
  // request separator from main via preload
  const sep = await (window as any).electron.system.getPathSeparator();
  return cleaned.join(sep);
}
