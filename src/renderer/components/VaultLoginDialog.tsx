import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { useTranslation } from 'react-i18next';
import { dialogStyles } from '../styles/dialogStyles';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (session: {
    host: string;
    port: number;
    mountPath: string;
  }) => void;
}

export default function VaultLoginDialog({ open, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const [host, setHost] = useState('');
  const [port, setPort] = useState('8200');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    if (loading) return;
    setError('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const portNum = parseInt(port, 10);
    if (!host.trim()) {
      setError(t('vault.login.errors.hostRequired') || 'Host is required');
      return;
    }
    if (Number.isNaN(portNum) || portNum < 1 || portNum > 65535) {
      setError(
        t('vault.login.errors.portInvalid') ||
          'Port must be between 1 and 65535',
      );
      return;
    }
    if (!token.trim()) {
      setError(t('vault.login.errors.tokenRequired') || 'Token is required');
      return;
    }

    setLoading(true);
    try {
      const result = await window.vaultAPI.login({
        host: host.trim(),
        port: portNum,
        token: token.trim(),
      });

      if (result.success) {
        setToken('');
        onSuccess({
          host: host.trim(),
          port: portNum,
          mountPath: 'secret',
        });
      } else {
        setError(
          result.error ||
            t('vault.login.errors.loginFailed') ||
            'Failed to connect to Vault',
        );
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: dialogStyles.dialogPaper }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={dialogStyles.dialogTitle}>
          {t('vault.login.title') || 'Connect to Vault'}
        </DialogTitle>
        <DialogContent sx={dialogStyles.dialogContent}>
          <Box
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2.5 }}
          >
            {error && <Alert severity="error">{error}</Alert>}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label={t('vault.login.host') || 'Host / IP'}
                value={host}
                onChange={(e) => setHost(e.target.value)}
                disabled={loading}
                required
                autoFocus
                size="small"
                sx={{ ...dialogStyles.textField, flex: 2 }}
              />
              <TextField
                label={t('vault.login.port') || 'Port'}
                value={port}
                onChange={(e) => setPort(e.target.value)}
                disabled={loading}
                required
                size="small"
                type="number"
                inputProps={{ min: 1, max: 65535 }}
                sx={{ ...dialogStyles.textField, flex: 1 }}
              />
            </Box>
            <TextField
              label={t('vault.login.token') || 'Token'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={loading}
              required
              size="small"
              type="password"
              autoComplete="off"
              sx={dialogStyles.textField}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={dialogStyles.dialogActions}>
          <Button
            onClick={handleClose}
            disabled={loading}
            sx={dialogStyles.cancelButton}
          >
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : undefined}
            sx={dialogStyles.confirmButton}
          >
            {t('vault.login.submit') || 'Connect'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
