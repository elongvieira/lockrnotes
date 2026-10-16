export const PROJECT_REPOSITORY_URL =
  'https://github.com/elongvieira/lockrnotes';

export const PROJECT_ISSUES_URL =
  'https://github.com/elongvieira/lockrnotes/issues';

/** MIT license file that applies to this project (includes upstream notices). */
export const PROJECT_LICENSE_URL =
  'https://github.com/elongvieira/lockrnotes/blob/main/LICENSE';

export function openExternalUrl(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}
