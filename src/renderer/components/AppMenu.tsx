import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';

export default function AppMenu() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static" color="transparent" elevation={0}>
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
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Lockr Notes
        </Typography>

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
