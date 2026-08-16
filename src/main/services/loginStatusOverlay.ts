export function buildLoginStatusOverlayScript(message: string): string {
  return `(() => {
  const ID = '__lockr-status-host';
  const text = ${JSON.stringify(message)};
  let host = document.getElementById(ID);
  if (!host) {
    host = document.createElement('div');
    host.id = ID;
    host.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483646;pointer-events:none;';
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = \`
      <style>
        .wrap {
          position: fixed;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          font-family: Segoe UI, system-ui, sans-serif;
          background: rgba(13, 24, 36, 0.94);
          color: #e6edf3;
          border: 1px solid #3d5a73;
          border-radius: 10px;
          padding: 10px 16px;
          box-shadow: 0 8px 24px rgba(0,0,0,.45);
          display: flex;
          align-items: center;
          gap: 10px;
          pointer-events: none;
        }
        .spin {
          width: 14px; height: 14px;
          border: 2px solid #3d5a73;
          border-top-color: #89b4fa;
          border-radius: 50%;
          animation: lockrspin .8s linear infinite;
        }
        @keyframes lockrspin { to { transform: rotate(360deg); } }
      </style>
      <div class="wrap"><div class="spin"></div><span id="msg"></span></div>
    \`;
    document.documentElement.appendChild(host);
  }
  const label = host.shadowRoot && host.shadowRoot.getElementById('msg');
  if (label) label.textContent = text;
})();`;
}

export function buildLoginStatusOverlayRemoveScript(): string {
  return `(() => {
  const host = document.getElementById('__lockr-status-host');
  if (host) host.remove();
})();`;
}
