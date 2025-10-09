import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuIcon from '@mui/icons-material/Menu';
import logo from '../../../assets/logo_a.png';

export default function AppMenu() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static" color="primary" elevation={0}>
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
        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <img
            src={logo}
            alt="Lockr Notes"
            style={{ height: 28, objectFit: 'contain' }}
          />
        </div>

        <Menu
          id="app-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          keepMounted
        >
          <MenuItem onClick={handleMenuClose}>New Note</MenuItem>
          <MenuItem onClick={handleMenuClose}>Save</MenuItem>
          <MenuItem onClick={handleMenuClose}>Delete</MenuItem>
          <MenuItem
            onClick={() => {
              handleMenuClose();
              // Send a sync or use ipcRenderer to trigger native exit if desired
            }}
          >
            Exit
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
