import React from 'react';
import theme from '../theme';
import logoPath from '../../../assets/logo_lock_a.png';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  return (
    <aside
      className={styles.sidebar}
      style={{
        borderRight: `1px solid ${theme.colors.sidebarBg}`,
        background: theme.colors.sidebarBg,
      }}
    >
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logoContainer}>
            <img src={logoPath} alt="Lockr Notes" className={styles.logo} />
          </div>
          <div className={styles.titleContainer}>
            <h3 className={styles.title} style={{ color: theme.colors.text }}>
              Lockr Notes
            </h3>
            <small style={{ color: theme.colors.muted }}>minhas notas</small>
          </div>
        </div>
      </div>

      <div className={styles.searchContainer}>
        <input
          placeholder="Pesquisar notas..."
          className={styles.searchInput}
        />
      </div>

      <div>
        <div className={styles.buttonsContainer}>
          <button
            className={styles.button}
            style={{
              border: `1px solid ${theme.colors.sidebarBg}`,
              background: theme.colors.background,
            }}
            type="button"
          >
            Local
          </button>
          <button
            className={styles.button}
            style={{
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
