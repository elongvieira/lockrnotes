import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  InputAdornment,
  Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';
import { useTranslation } from 'react-i18next';
import { dialogStyles } from '../styles/dialogStyles';

interface PasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  filename?: string;
  error?: string;
}

export default function PasswordDialog({
  open,
  onClose,
  onConfirm,
  filename = '',
  error = '',
}: PasswordDialogProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setPassword('');
      setShowPassword(false);
    }
  }, [open]);

  const handleConfirm = () => {
    if (password.trim()) {
      onConfirm(password);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: dialogStyles.dialogPaper,
      }}
    >
      <DialogTitle sx={dialogStyles.dialogTitle}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockIcon />
          <span>{t('dialog.password.title') || 'Arquivo Protegido'}</span>
        </Box>
      </DialogTitle>
      <DialogContent sx={dialogStyles.dialogContent}>
        <Typography
          variant="body2"
          sx={{ mb: 2, color: 'var(--text-secondary)' }}
        >
          {t('dialog.password.message') ||
            'Este arquivo está protegido por senha. Digite a senha para abrir:'}
        </Typography>
        {filename && (
          <Typography
            variant="body2"
            sx={{ mb: 2, color: 'var(--primary-blue)', fontWeight: 'bold' }}
          >
            {filename}
          </Typography>
        )}
        <TextField
          autoFocus
          fullWidth
          type={showPassword ? 'text' : 'password'}
          label={t('dialog.password.passwordLabel') || 'Senha'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          variant="outlined"
          sx={dialogStyles.textField}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  size="small"
                  sx={dialogStyles.passwordIcon}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {error && (
          <Box sx={dialogStyles.errorText}>
            {error}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={dialogStyles.dialogActions}>
        <Button onClick={onClose} sx={dialogStyles.cancelButton}>
          {t('dialog.actions.cancel') || 'Cancelar'}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!password.trim()}
          sx={dialogStyles.confirmButton}
        >
          {t('dialog.actions.unlock') || 'Desbloquear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

PasswordDialog.defaultProps = {
  filename: '',
  error: '',
};
