import React from 'react';
import theme from '../theme';
import logoPath from '../../../assets/logo_lock_a.png';

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 320,
        padding: 16,
        borderRight: `1px solid ${theme.colors.sidebarBg}`,
        background: theme.colors.sidebarBg,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src={logoPath}
              alt="Lockr Notes"
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                objectFit: 'cover',
              }}
            />
          </div>
          <div style={{ marginLeft: 12 }}>
            <h3 style={{ margin: 0, color: theme.colors.text }}>Lockr Notes</h3>
            <small style={{ color: theme.colors.muted }}>minhas notas</small>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          placeholder="Pesquisar notas..."
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 6,
            border: '1px solid #ddd',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 6,
              border: `1px solid ${theme.colors.sidebarBg}`,
              background: theme.colors.background,
            }}
            type="button"
          >
            Local
          </button>
          <button
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 6,
              border: `1px solid ${theme.colors.sidebarBg}`,
              background: theme.colors.background,
            }}
            type="button"
          >
            Remote
          </button>
        </div>
      </div>
    </aside>
  );
}
