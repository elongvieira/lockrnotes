import React, { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';

interface NotificationData {
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

function NotificationSnackbar() {
  const [notification, setNotification] = useState<NotificationData | null>(
    null,
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleShowNotification = (event: Event) => {
      const customEvent = event as CustomEvent<NotificationData>;
      setNotification(customEvent.detail);
      setOpen(true);
    };

    const handleHideNotification = () => {
      setOpen(false);
    };

    window.addEventListener('show-notification', handleShowNotification);
    window.addEventListener('hide-notification', handleHideNotification);

    return () => {
      window.removeEventListener('show-notification', handleShowNotification);
      window.removeEventListener('hide-notification', handleHideNotification);
    };
  }, []);

  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  if (!notification) {
    return null;
  }

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={handleClose}
        severity={notification.severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {notification.message}
      </Alert>
    </Snackbar>
  );
}

export default NotificationSnackbar;
