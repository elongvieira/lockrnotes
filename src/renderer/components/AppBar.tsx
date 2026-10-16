import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import MenuIcon from '@mui/icons-material/Menu';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import logo from '../../../assets/logo_a.png';
import SettingsDialog from './SettingsDialog';
import HotCopyBar from './HotCopyBar';
import HotCopyManageDialog from './HotCopyManageDialog';
import ImportDialog from './ImportDialog';
import AboutDialog from './AboutDialog';
import { HotCopyItem } from '../types/hotcopy';
import type { ImportFileInfo } from '../../main/preload/importApi';
import { useAppContext } from '../contexts/AppContext';
import './AppBar.css';

export default function AppBar() {
  const { t, i18n } = useTranslation();
  const { refreshSidebar } = useAppContext();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [hotCopyManageOpen, setHotCopyManageOpen] = useState(false);
  const [hotCopyItems, setHotCopyItems] = useState<HotCopyItem[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [filesToImport, setFilesToImport] = useState<ImportFileInfo[]>([]);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [langAnchor, setLangAnchor] = React.useState<null | HTMLElement>(null);

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
              setAboutOpen(true);
              handleMenuClose();
            }}
            className="app-menu-item"
          >
            <ListItemIcon className="app-menu-icon">
              <InfoOutlinedIcon fontSize="small" />
            </ListItemIcon>
            {t('menu.about') || 'Sobre'}
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
        <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
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
      </Toolbar>
    </MuiAppBar>
  );
}
