/**
 * Builds a page script that fills visible username/password fields.
 * Credentials are embedded with JSON.stringify to avoid injection.
 */
export function buildWebLoginFillScript(
  username: string,
  password: string,
): string {
  return `(() => {
  const USERNAME = ${JSON.stringify(username)};
  const PASSWORD = ${JSON.stringify(password)};
  const FILL_WINDOW_MS = 30000;

  if (window.__lockrWebLoginCleanup) {
    window.__lockrWebLoginCleanup();
  }

  function isVisible(el) {
    if (!el || el.disabled) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function looksLikeNewPassword(el) {
    const ac = (el.autocomplete || el.getAttribute('autocomplete') || '').toLowerCase();
    if (ac === 'new-password') return true;
    const hint = ((el.name || '') + ' ' + (el.id || '')).toLowerCase();
    return (
      hint.includes('confirm')
      || hint.includes('newpassword')
      || hint.includes('new-password')
      || hint.includes('new_password')
    );
  }

  function setNativeValue(el, value) {
    if (!el) return;
    el.focus();
    const proto = el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    setter?.call(el, value);
    el.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText' }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur();
    el.focus();
  }

  function findPasswordField() {
    return Array.from(document.querySelectorAll('input[type="password"]')).find((el) => (
      isVisible(el) && !looksLikeNewPassword(el)
    )) || null;
  }

  function findUsernameField(passwordField) {
    const selectors = [
      'input[autocomplete="username"]',
      'input[autocomplete="email"]',
      'input[type="email"]',
      'input[name*="user" i]',
      'input[name*="login" i]',
      'input[name*="email" i]',
      'input[id*="user" i]',
      'input[id*="login" i]',
      'input[id*="email" i]',
      'input[type="text"]',
      'input:not([type])',
    ];
    for (const selector of selectors) {
      const match = Array.from(document.querySelectorAll(selector)).find((el) => (
        isVisible(el)
        && el !== passwordField
        && el.type !== 'password'
        && el.type !== 'hidden'
        && el.type !== 'submit'
        && el.type !== 'checkbox'
        && el.type !== 'radio'
        && el.type !== 'button'
      ));
      if (match) return match;
    }
    if (passwordField) {
      const inputs = Array.from(document.querySelectorAll('input')).filter(isVisible);
      const idx = inputs.indexOf(passwordField);
      for (let i = idx - 1; i >= 0; i -= 1) {
        const el = inputs[i];
        if (el.type !== 'password' && el.type !== 'hidden' && el.type !== 'submit' && el.type !== 'checkbox' && el.type !== 'radio') {
          return el;
        }
      }
    }
    return null;
  }

  function tryFill() {
    const passwordField = findPasswordField();
    const usernameField = findUsernameField(passwordField);
    if (usernameField && USERNAME && usernameField.value !== USERNAME) {
      setNativeValue(usernameField, USERNAME);
    }
    if (passwordField && PASSWORD && passwordField.value !== PASSWORD) {
      setNativeValue(passwordField, PASSWORD);
    }
  }

  tryFill();
  const observer = new MutationObserver(() => tryFill());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  const timer = setTimeout(() => observer.disconnect(), FILL_WINDOW_MS);
  window.__lockrWebLoginCleanup = () => {
    observer.disconnect();
    clearTimeout(timer);
  };
})();`;
}
