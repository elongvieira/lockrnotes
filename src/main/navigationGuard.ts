import { shell, type WebContents } from 'electron';
import { isAllowedAppNavigation, isAllowedExternalUrl } from './util';

/**
 * Keep the app window on its own document. http(s) links opened with
 * window.open go to the system browser; other protocols are ignored.
 */
export function guardAppNavigation(contents: WebContents, appUrl: string) {
  const blockForeignNavigation = (details: {
    url: string;
    preventDefault: () => void;
  }) => {
    if (!isAllowedAppNavigation(details.url, appUrl)) {
      details.preventDefault();
    }
  };

  contents.on('will-navigate', blockForeignNavigation);
  contents.on('will-redirect', blockForeignNavigation);
  contents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternalUrl(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}
