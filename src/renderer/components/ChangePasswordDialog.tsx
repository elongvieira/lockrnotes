import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { dialogStyles } from '../styles/dialogStyles';

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ChangePasswordDialog({
  open,
  onClose,
  onSuccess,
}: ChangePasswordDialogProps) {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    setError('');

    // Validation
    if (!currentPassword) {
      setError(t('community.changePassword.errors.currentRequired'));
      return;
    }
    if (!newPassword) {
      setError(t('community.changePassword.errors.newRequired'));
      return;
    }
    if (!confirmPassword) {
      setError(t('community.changePassword.errors.confirmRequired'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('community.changePassword.errors.mismatch'));
      return;
    }

    setLoading(true);
    try {
      const result = await window.communityAuthAPI?.changePassword({
        currentPassword,
        newPassword,
      });

      if (!result?.success) {
        setError(
          result?.error || t('community.changePassword.errors.changeFailed'),
        );
        return;
      }

      // Clear fields and close dialog
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('community.changePassword.errors.changeFailed'),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleChangePassword();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: dialogStyles.dialogPaper }}
    >
      <DialogTitle sx={dialogStyles.dialogTitle}>
        {t('community.changePassword.title')}
      </DialogTitle>
      <DialogContent sx={dialogStyles.dialogContent}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2.5 }}>
          <Alert severity="info">{t('community.changePassword.message')}</Alert>

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label={t('community.changePassword.currentPassword')}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            required
            size="small"
            fullWidth
            sx={dialogStyles.textField}
          />

          <TextField
            label={t('community.changePassword.newPassword')}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            required
            size="small"
            fullWidth
            sx={dialogStyles.textField}
          />

          <TextField
            label={t('community.changePassword.confirmPassword')}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            required
            size="small"
            fullWidth
            sx={dialogStyles.textField}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={dialogStyles.dialogActions}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={dialogStyles.cancelButton}
        >
          {t('common.cancel') || 'Cancel'}
        </Button>
        <Button
          onClick={handleChangePassword}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
          sx={dialogStyles.confirmButton}
        >
          {loading ? 'Changing...' : t('community.changePassword.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
