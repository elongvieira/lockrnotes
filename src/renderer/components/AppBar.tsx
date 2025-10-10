import React from 'react';
import { useTranslation } from 'react-i18next';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuIcon from '@mui/icons-material/Menu';
import logo from '../../../assets/logo_a.png';
import './AppBar.css';

export default function AppBar() {
  const { t, i18n } = useTranslation();
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
          <img
            src={logo}
            alt="Lockr Notes"
            style={{ height: 28, objectFit: 'contain' }}
          />
        </div>

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
          >
            <MenuItem onClick={() => changeLanguage('pt-BR')}>
              Português (BR)
            </MenuItem>
            <MenuItem onClick={() => changeLanguage('en')}>English</MenuItem>
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
        >
          <MenuItem onClick={handleMenuClose}>{t('menu.new')}</MenuItem>
          <MenuItem onClick={handleMenuClose}>{t('menu.save')}</MenuItem>
          <MenuItem onClick={handleMenuClose}>{t('menu.delete')}</MenuItem>
          <MenuItem
            onClick={() => {
              handleMenuClose();
            }}
          >
            {t('menu.exit')}
          </MenuItem>
        </Menu>
      </Toolbar>
    </MuiAppBar>
  );
}
