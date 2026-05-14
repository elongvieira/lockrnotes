import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import MenuIcon from '@mui/icons-material/Menu';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import CloudIcon from '@mui/icons-material/Cloud';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import logo from '../../../assets/logo_a.png';
import SettingsDialog from './SettingsDialog';
import HotCopyBar from './HotCopyBar';
import HotCopyManageDialog from './HotCopyManageDialog';
import ImportDialog from './ImportDialog';
import AdminDialog from './admin/AdminDialog';
import ConfirmDialog from './ConfirmDialog';
import { HotCopyItem } from '../types/hotcopy';
import type { ImportFileInfo } from '../../main/preload/importApi';
import { useAppContext } from '../contexts/AppContext';
import { dialogStyles } from '../styles/dialogStyles';
import './AppBar.css';

export default function AppBar() {
  const { t, i18n } = useTranslation();
  const {
    refreshSidebar,
    communitySession,
    setCommunitySession,
    vaultSession,
    setVaultSession,
  } = useAppContext();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hotCopyManageOpen, setHotCopyManageOpen] = useState(false);
  const [hotCopyItems, setHotCopyItems] = useState<HotCopyItem[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [filesToImport, setFilesToImport] = useState<ImportFileInfo[]>([]);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [langAnchor, setLangAnchor] = React.useState<null | HTMLElement>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [vaultLogoutConfirmOpen, setVaultLogoutConfirmOpen] = useState(false);

  // Load persisted community session on mount
  useEffect(() => {
    window.communityAuthAPI
      ?.getSession()
      .then((res) => {
        if (res.success && res.session) setCommunitySession(res.session);
        return res;
      })
      .catch(() => {});
  }, [setCommunitySession]);

  // Load persisted vault session on mount
  useEffect(() => {
    window.vaultAPI
      ?.getSession()
      .then((res) => {
        if (res.success && res.session) setVaultSession(res.session);
        return res;
      })
      .catch(() => {});
  }, [setVaultSession]);

  const handleCommunityLogout = async () => {
    try {
      await window.communityAuthAPI?.logout();
      setCommunitySession(null);
      setLogoutConfirmOpen(false);
    } catch {
      // ignore
    }
  };

  const handleVaultLogout = async () => {
    try {
      await window.vaultAPI?.logout();
      setVaultSession(null);
      setVaultLogoutConfirmOpen(false);
    } catch {
      // ignore
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLangOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLangAnchor(event.currentTarget);
  };

  const handleLangClose = () => {
    setLangAnchor(null);
  };

  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
    handleLangClose();
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMinimize = () => {
    window.electron?.window?.minimize();
  };

  const handleToggleMaximize = async () => {
    await window.electron?.window?.toggleMaximize();
  };

  const handleClose = () => {
    window.electron?.window?.close();
  };

  const handleExport = async () => {
    handleMenuClose();

    try {
      // Show in-progress notification
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: {
            message:
              t('notifications.exportInProgress') || 'Exporting files...',
            severity: 'info',
          },
        }),
      );

      // Select folder
      const folderResult = await window.exportAPI.selectFolder();

      if (folderResult.canceled || !folderResult.folderPath) {
        window.dispatchEvent(
          new CustomEvent('show-notification', {
            detail: {
              message:
                t('notifications.exportNoFolder') ||
                'No folder selected for export',
              severity: 'warning',
            },
          }),
        );
        return;
      }

      // Export all files
      const exportResult = await window.exportAPI.exportAll(
        folderResult.folderPath,
      );

      if (exportResult.success && exportResult.zipPath) {
        window.dispatchEvent(
          new CustomEvent('show-notification', {
            detail: {
              message:
                t('notifications.exportSuccess', {
                  count: exportResult.filesExported || 0,
                  path: exportResult.zipPath,
                }) ||
                `Export completed! ${exportResult.filesExported} files exported`,
              severity: 'success',
            },
          }),
        );
      } else {
        window.dispatchEvent(
          new CustomEvent('show-notification', {
            detail: {
              message:
                t('notifications.exportError', {
                  error: exportResult.error || 'Unknown error',
                }) || `Error exporting files: ${exportResult.error}`,
              severity: 'error',
            },
          }),
        );
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Export error:', error);
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: {
            message:
              t('notifications.exportError', {
                error: error instanceof Error ? error.message : 'Unknown error',
              }) || 'Error exporting files',
            severity: 'error',
          },
        }),
      );
    }
  };

  const handleImport = async () => {
    handleMenuClose();
    try {
      const result = await window.importAPI.selectFiles();
      if (result.canceled || result.files.length === 0) {
        return;
      }
      setFilesToImport(result.files);
      setImportDialogOpen(true);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Import select error:', error);
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: {
            message:
              t('notifications.importError', {
                error: error instanceof Error ? error.message : 'Unknown error',
              }) || 'Erro ao selecionar arquivos para importar',
            severity: 'error',
          },
        }),
      );
    }
  };

  const handleImportComplete = () => {
    setImportDialogOpen(false);
    refreshSidebar();
  };

  const loadHotCopyItems = async () => {
    try {
      const config = await window.electron?.filesystem?.readConfig();
      if (config?.hotCopy?.items) {
        setHotCopyItems(config.hotCopy.items);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load hot copy items:', error);
    }
  };

  const handleManageHotCopy = () => {
    loadHotCopyItems();
    setHotCopyManageOpen(true);
  };

  return (
    <MuiAppBar
      position="static"
      color="primary"
      elevation={0}
      className="appbar"
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={handleMenuOpen}
          size="large"
        >
          <MenuIcon />
        </IconButton>

        <div className="appbar-left">
          <img src={logo} alt="Lockr Notes" className="appbar-logo" />
        </div>

        {/* HotCopy Bar in the center */}
        <HotCopyBar onManage={handleManageHotCopy} />

        {/* central drag area */}
        <div className="appbar-drag" />

        <div className="appbar-actions">
          <button
            type="button"
            className="lang-btn"
            onClick={handleLangOpen}
            aria-label="language"
          >
            {i18n.language || 'pt-BR'}
          </button>
          <Menu
            id="lang-menu"
            anchorEl={langAnchor}
            open={Boolean(langAnchor)}
            onClose={handleLangClose}
            keepMounted
            slotProps={{
              paper: {
                className: 'app-menu-paper',
              },
            }}
          >
            <MenuItem
              onClick={() => changeLanguage('pt-BR')}
              className="app-menu-item"
            >
              Português (BR)
            </MenuItem>
            <MenuItem
              onClick={() => changeLanguage('en')}
              className="app-menu-item"
            >
              English
            </MenuItem>
          </Menu>

          {/* Community server connection indicator */}
          {communitySession && (
            <Tooltip
              title={`${communitySession.email} @ ${communitySession.host}:${communitySession.port}`}
            >
              <Chip
                icon={<CloudIcon sx={dialogStyles.iconMedium} />}
                onDelete={() => setLogoutConfirmOpen(true)}
                deleteIcon={
                  <Tooltip title={t('community.logout') || 'Logout'}>
                    <LogoutIcon sx={dialogStyles.iconSmall} />
                  </Tooltip>
                }
                sx={{
                  height: 32,
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--primary-blue)',
                  backgroundColor: 'var(--primary-blue-light)',
                  webkitAppRegion: 'no-drag',
                  '& .MuiChip-icon': { color: 'var(--primary-blue)' },
                  '& .MuiChip-deleteIcon': {
                    color: 'var(--text-secondary)',
                    '&:hover': { color: 'var(--text-primary)' },
                  },
                }}
              />
            </Tooltip>
          )}

          {/* Vault connection indicator */}
          {vaultSession && (
            <Tooltip
              title={`Vault @ ${vaultSession.host}:${vaultSession.port}`}
            >
              <Chip
                icon={<VpnKeyIcon sx={dialogStyles.iconMedium} />}
                onDelete={() => setVaultLogoutConfirmOpen(true)}
                deleteIcon={
                  <Tooltip title={t('vault.logout') || 'Disconnect'}>
                    <LogoutIcon sx={dialogStyles.iconSmall} />
                  </Tooltip>
                }
                sx={{
                  height: 32,
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--primary-blue)',
                  backgroundColor: 'var(--primary-blue-light)',
                  webkitAppRegion: 'no-drag',
                  '& .MuiChip-icon': { color: 'var(--primary-blue)' },
                  '& .MuiChip-deleteIcon': {
                    color: 'var(--text-secondary)',
                    '&:hover': { color: 'var(--text-primary)' },
                  },
                }}
              />
            </Tooltip>
          )}

          <button type="button" className="window-btn" onClick={handleMinimize}>
            —
          </button>
          <button
            type="button"
            className="window-btn"
            onClick={handleToggleMaximize}
          >
            ☐
          </button>
          <button
            type="button"
            className="window-btn close"
            onClick={handleClose}
          >
            X
          </button>
        </div>

        <Menu
          id="app-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          keepMounted
          slotProps={{
            paper: {
              className: 'app-menu-paper',
            },
          }}
        >
          <MenuItem
            onClick={() => {
              setSettingsOpen(true);
              handleMenuClose();
            }}
            className="app-menu-item"
          >
            <ListItemIcon className="app-menu-icon">
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            {t('settings.title') || 'Configurações'}
          </MenuItem>
          {communitySession?.isAdmin && (
            <MenuItem
              onClick={() => {
                setAdminOpen(true);
                handleMenuClose();
              }}
              className="app-menu-item"
            >
              <ListItemIcon className="app-menu-icon">
                <AdminPanelSettingsIcon fontSize="small" />
              </ListItemIcon>
              {t('admin.menuTitle')}
            </MenuItem>
          )}
          <MenuItem onClick={handleExport} className="app-menu-item">
            <ListItemIcon className="app-menu-icon">
              <DownloadIcon fontSize="small" />
            </ListItemIcon>
            {t('menu.export') || '📦 Exportar tudo'}
          </MenuItem>
          <MenuItem onClick={handleImport} className="app-menu-item">
            <ListItemIcon className="app-menu-icon">
              <UploadIcon fontSize="small" />
            </ListItemIcon>
            {t('menu.import') || '📥 Importar arquivos'}
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleMenuClose();
              window.electron?.window?.close();
            }}
            className="app-menu-item"
          >
            <ListItemIcon className="app-menu-icon">
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            {t('menu.exit')}
          </MenuItem>
        </Menu>
        <SettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
        <HotCopyManageDialog
          open={hotCopyManageOpen}
          onClose={() => setHotCopyManageOpen(false)}
          items={hotCopyItems}
          onUpdate={loadHotCopyItems}
        />
        <ImportDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          files={filesToImport}
          onImportComplete={handleImportComplete}
        />
        <AdminDialog open={adminOpen} onClose={() => setAdminOpen(false)} />
        <ConfirmDialog
          open={logoutConfirmOpen}
          title={t('community.logout.title') || 'Logout'}
          message={
            t('community.logout.message') ||
            'Are you sure you want to disconnect?'
          }
          onConfirm={handleCommunityLogout}
          onClose={() => setLogoutConfirmOpen(false)}
        />
        <ConfirmDialog
          open={vaultLogoutConfirmOpen}
          title={t('vault.logoutDialog.title') || 'Disconnect from Vault'}
          message={
            t('vault.logoutDialog.message') ||
            'Are you sure you want to disconnect from the Vault server?'
          }
          onConfirm={handleVaultLogout}
          onClose={() => setVaultLogoutConfirmOpen(false)}
        />
      </Toolbar>
    </MuiAppBar>
  );
}
