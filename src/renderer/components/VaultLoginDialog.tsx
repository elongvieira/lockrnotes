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
import MenuItem from '@mui/material/MenuItem';
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
  const [authMethod, setAuthMethod] = useState<'token' | 'ldap'>('token');
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      setError(
        t('vault.loginDialog.errors.hostRequired') || 'Host is required',
      );
      return;
    }
    if (Number.isNaN(portNum) || portNum < 1 || portNum > 65535) {
      setError(
        t('vault.loginDialog.errors.portInvalid') ||
          'Port must be between 1 and 65535',
      );
      return;
    }
    if (authMethod === 'token' && !token.trim()) {
      setError(
        t('vault.loginDialog.errors.tokenRequired') || 'Token is required',
      );
      return;
    }

    if (authMethod === 'ldap') {
      if (!username.trim()) {
        setError(
          t('vault.loginDialog.errors.usernameRequired') ||
            'Username is required',
        );
        return;
      }
      if (!password.trim()) {
        setError(
          t('vault.loginDialog.errors.passwordRequired') ||
            'Password is required',
        );
        return;
      }
    }

    setLoading(true);
    try {
      const result = await window.vaultAPI.login({
        host: host.trim(),
        port: portNum,
        authMethod,
        token: token.trim(),
        username: username.trim(),
        password: password.trim(),
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
            t('vault.loginDialog.errors.loginFailed') ||
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
          {t('vault.loginDialog.title') || 'Connect to Vault'}
        </DialogTitle>
        <DialogContent sx={dialogStyles.dialogContent}>
          <Box
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2.5 }}
          >
            {error && <Alert severity="error">{error}</Alert>}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label={t('vault.loginDialog.host') || 'Host / IP'}
                value={host}
                onChange={(e) => setHost(e.target.value)}
                disabled={loading}
                required
                autoFocus
                size="small"
                sx={{ ...dialogStyles.textField, flex: 2 }}
              />
              <TextField
                label={t('vault.loginDialog.port') || 'Port'}
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
              select
              label={
                t('vault.loginDialog.authMethod') || 'Authentication Method'
              }
              value={authMethod}
              onChange={(e) =>
                setAuthMethod(e.target.value as 'token' | 'ldap')
              }
              size="small"
              fullWidth
              sx={{ ...dialogStyles.textField, mb: 1 }}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: dialogStyles.selectPaper,
                  },
                },
              }}
            >
              <MenuItem value="token">
                {t('vault.loginDialog.methodToken') || 'Token'}
              </MenuItem>
              <MenuItem value="ldap">
                {t('vault.loginDialog.methodLdap') || 'LDAP'}
              </MenuItem>
            </TextField>
            {authMethod === 'token' ? (
              <TextField
                label={t('vault.loginDialog.token') || 'Token'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={loading}
                required
                size="small"
                type="password"
                autoComplete="off"
                sx={dialogStyles.textField}
              />
            ) : (
              <>
                <TextField
                  label={t('vault.loginDialog.username') || 'Username'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                  size="small"
                  sx={dialogStyles.textField}
                />
                <TextField
                  label={t('vault.loginDialog.password') || 'Password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  size="small"
                  type="password"
                  autoComplete="off"
                  sx={dialogStyles.textField}
                />
              </>
            )}
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
            {t('vault.loginDialog.connect') || 'Connect'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
