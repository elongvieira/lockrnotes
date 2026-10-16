export const CLIPBOARD_CLEAR_MS = 30_000;

export function shouldClearClipboard(current: string, copied: string): boolean {
  return current === copied && copied.length > 0;
}

/** Copies text and removes it later if the user has not copied something else. */
export function copyTextTemporarily(
  text: string,
  clearAfterMs = CLIPBOARD_CLEAR_MS,
): Promise<void> {
  const write = navigator.clipboard.writeText(text);
  setTimeout(() => {
    navigator.clipboard
      .readText()
      .then((current) => {
        if (!shouldClearClipboard(current, text)) return undefined;
        return navigator.clipboard.writeText('');
      })
      .catch(() => undefined);
  }, clearAfterMs);
  return write;
}
