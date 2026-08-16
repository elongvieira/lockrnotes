import type { CustomLoginStep } from '../../renderer/types/jsonEntry';

export function buildCustomLoginReplayStepScript(
  step: CustomLoginStep,
): string {
  return `(() => {
  const step = ${JSON.stringify(step)};
  const TIMEOUT_MS = 8000;

  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function setNativeValue(el, value) {
    el.focus();
    const proto = el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    setter?.call(el, value);
    el.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText' }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function bySelector() {
    if (!step.selector) return null;
    try {
      return Array.from(document.querySelectorAll(step.selector)).find(isVisible) || null;
    } catch (err) {
      return null;
    }
  }

  function byClickText() {
    if (step.kind !== 'click' || !step.text) return null;
    const candidates = Array.from(document.querySelectorAll('a, button, [role="button"], [role="link"], input[type="submit"], input[type="button"]'));
    const needle = String(step.text).trim().toLowerCase();
    return candidates.find((el) => isVisible(el) && (el.innerText || el.value || '').trim().toLowerCase().includes(needle)) || null;
  }

  function findElement() {
    return bySelector() || byClickText();
  }

  function waitForElement() {
    return new Promise((resolve) => {
      const started = Date.now();
      const tick = () => {
        const el = findElement();
        if (el) {
          resolve(el);
          return;
        }
        if (Date.now() - started >= TIMEOUT_MS) {
          resolve(null);
          return;
        }
        setTimeout(tick, 200);
      };
      tick();
    });
  }

  return waitForElement().then((el) => {
    if (!el) {
      return { ok: false, error: 'Element not found: ' + (step.label || step.selector) };
    }
    if (step.kind === 'click') {
      el.click();
      return { ok: true };
    }
    setNativeValue(el, step.value || '');
    return { ok: true };
  });
})()`;
}
