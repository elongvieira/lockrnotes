import type { CustomLoginStep } from '../../renderer/types/jsonEntry';

export const LOCKR_MACRO_CONSOLE_PREFIX = '__LOCKR_MACRO__';

export function parseMacroConsoleMessage(
  message: string,
): { op: 'step'; step: CustomLoginStep } | { op: 'stop' } | null {
  if (!message || !message.startsWith(LOCKR_MACRO_CONSOLE_PREFIX)) {
    return null;
  }
  try {
    const payload = JSON.parse(
      message.slice(LOCKR_MACRO_CONSOLE_PREFIX.length),
    );
    if (payload?.op === 'stop') {
      return { op: 'stop' };
    }
    if (payload?.op === 'step' && payload.step && payload.step.kind) {
      return { op: 'step', step: payload.step };
    }
  } catch {
    return null;
  }
  return null;
}

export function buildCustomLoginRecorderScript(): string {
  const prefix = JSON.stringify(LOCKR_MACRO_CONSOLE_PREFIX);
  return `(() => {
  if (window.__lockrMacro) {
    window.__lockrMacro.ensureOverlay();
    return;
  }

  const PREFIX = ${prefix};
  const HOST_ID = '__lockr-macro-host';
  const queue = [];

  function emit(payload) {
    queue.push(payload);
    try {
      console.log(PREFIX + JSON.stringify(payload));
    } catch (err) { /* ignore */ }
  }

  function uid() {
    return 'step_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  }

  function cssEscape(value) {
    if (window.CSS && CSS.escape) return CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\\\$&');
  }

  function buildSelector(el) {
    if (!(el instanceof Element)) return '';
    try {
      if (el.id) {
        const idSel = '#' + cssEscape(el.id);
        if (document.querySelectorAll(idSel).length === 1) return idSel;
      }
      const name = el.getAttribute('name');
      if (name) {
        const sel = el.tagName.toLowerCase() + '[name="' + cssEscape(name) + '"]';
        if (document.querySelectorAll(sel).length === 1) return sel;
      }
      const testid = el.getAttribute('data-testid');
      if (testid) {
        const sel = '[data-testid="' + cssEscape(testid) + '"]';
        if (document.querySelectorAll(sel).length === 1) return sel;
      }
      const aria = el.getAttribute('aria-label');
      if (aria) {
        const sel = el.tagName.toLowerCase() + '[aria-label="' + cssEscape(aria) + '"]';
        if (document.querySelectorAll(sel).length === 1) return sel;
      }
    } catch (err) { /* ignore */ }

    const parts = [];
    let node = el;
    let depth = 0;
    while (node && node.nodeType === 1 && node !== document.documentElement && depth < 6) {
      let part = node.tagName.toLowerCase();
      if (node.parentElement) {
        const siblings = Array.from(node.parentElement.children).filter((child) => child.tagName === node.tagName);
        if (siblings.length > 1) {
          part += ':nth-of-type(' + (siblings.indexOf(node) + 1) + ')';
        }
      }
      parts.unshift(part);
      node = node.parentElement;
      depth += 1;
    }
    return parts.join(' > ');
  }

  function fieldLabel(el) {
    try {
      if (el.id) {
        const lab = document.querySelector('label[for="' + cssEscape(el.id) + '"]');
        if (lab && lab.textContent && lab.textContent.trim()) {
          return lab.textContent.trim().slice(0, 80);
        }
      }
    } catch (err) { /* ignore */ }
    const wrapped = el.closest && el.closest('label');
    if (wrapped && wrapped.textContent && wrapped.textContent.trim()) {
      return wrapped.textContent.trim().replace(/\\s+/g, ' ').slice(0, 80);
    }
    return (
      el.getAttribute('aria-label') ||
      el.getAttribute('placeholder') ||
      el.getAttribute('name') ||
      el.getAttribute('type') ||
      'Campo'
    );
  }

  function clickLabel(el) {
    const text = (
      (el.innerText || el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || el.value || '')
    ).trim().replace(/\\s+/g, ' ');
    return (text || el.tagName || 'item').slice(0, 80);
  }

  function isOverlayEvent(event) {
    const path = event.composedPath ? event.composedPath() : [];
    return path.some((node) => node && node.id === HOST_ID);
  }

  let pendingType = null;

  function isFillable(el) {
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true;
    if (el instanceof HTMLInputElement) {
      const skip = ['hidden','submit','button','checkbox','radio','file','image','reset','range','color'];
      return skip.indexOf(el.type) === -1;
    }
    if (el instanceof HTMLElement && (el.isContentEditable || el.getAttribute('role') === 'textbox')) {
      return true;
    }
    return false;
  }

  function captureFrom(el) {
    return {
      label: fieldLabel(el),
      selector: buildSelector(el),
      value: el.value || (el.isContentEditable ? (el.innerText || '') : ''),
      isPassword: el instanceof HTMLInputElement && el.type === 'password',
    };
  }

  function flushPendingType() {
    if (!pendingType) return;
    emit({
      op: 'step',
      step: {
        id: uid(),
        kind: 'type',
        label: pendingType.label,
        selector: pendingType.selector,
        value: pendingType.value,
        isPassword: pendingType.isPassword,
        origin: location.origin,
      },
    });
    pendingType = null;
  }

  function onInput(event) {
    if (isOverlayEvent(event)) return;
    const el = event.target;
    if (!isFillable(el)) return;
    const next = captureFrom(el);
    if (pendingType && pendingType.selector && next.selector && pendingType.selector !== next.selector) {
      flushPendingType();
    }
    pendingType = next;
  }

  function onFocusIn(event) {
    if (isOverlayEvent(event)) return;
    const el = event.target;
    if (!isFillable(el)) return;
    const nextSelector = buildSelector(el);
    if (pendingType && pendingType.selector && pendingType.selector !== nextSelector) {
      flushPendingType();
    }
  }

  function onFocusOut(event) {
    if (isOverlayEvent(event)) return;
    if (isFillable(event.target)) {
      flushPendingType();
    }
  }

  function onKeyDown(event) {
    if (event.key === 'Enter' || event.key === 'Tab') {
      flushPendingType();
    }
  }

  function onClick(event) {
    if (event.button !== 0) return;
    if (isOverlayEvent(event)) return;
    const el = event.target;
    if (isFillable(el)) {
      return;
    }
    flushPendingType();
    const clickable = el.closest && el.closest('a, button, [role="button"], [role="link"], input[type="submit"], input[type="button"]');
    if (!(clickable instanceof Element)) return;
    emit({
      op: 'step',
      step: {
        id: uid(),
        kind: 'click',
        label: clickLabel(clickable),
        selector: buildSelector(clickable),
        text: clickLabel(clickable),
        origin: location.origin,
      },
    });
  }

  function ensureOverlay() {
    if (document.getElementById(HOST_ID)) return;
    const host = document.createElement('div');
    host.id = HOST_ID;
    host.style.cssText = 'all:initial;position:fixed;top:12px;right:12px;z-index:2147483647;';
    const shadow = host.attachShadow({ mode: 'closed' });
    shadow.innerHTML = \`
      <style>
        :host { all: initial; }
        .bar {
          font-family: Segoe UI, system-ui, sans-serif;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #0d1824;
          color: #e6edf3;
          border: 1px solid #3d5a73;
          border-radius: 10px;
          padding: 8px 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,.45);
        }
        .dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: #f38ba8; box-shadow: 0 0 0 4px rgba(243,139,168,.2);
        }
        button {
          background: #f38ba8; color: #1e1e2e; border: 0; border-radius: 6px;
          font-weight: 700; padding: 6px 10px; cursor: pointer;
        }
      </style>
      <div class="bar">
        <span class="dot"></span>
        <span>Gravando macro</span>
        <button type="button" id="stop">Parar</button>
      </div>
    \`;
    shadow.getElementById('stop')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      flushPendingType();
      emit({ op: 'stop' });
    });
    document.documentElement.appendChild(host);
  }

  document.addEventListener('input', onInput, true);
  document.addEventListener('change', onInput, true);
  document.addEventListener('focusin', onFocusIn, true);
  document.addEventListener('focusout', onFocusOut, true);
  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('click', onClick, true);
  window.addEventListener('pagehide', flushPendingType);

  window.__lockrMacro = {
    ensureOverlay,
    flushPendingType,
    flushQueue() {
      return queue.splice(0, queue.length);
    },
  };
  ensureOverlay();
  setInterval(ensureOverlay, 1500);
})();`;
}
