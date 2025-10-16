import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { dialogStyles } from '../styles/dialogStyles';

interface RenameDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
  currentName: string;
  itemType: 'file' | 'folder';
  isFileOpen?: boolean;
}

export default function RenameDialog({
  open,
  onClose,
  onConfirm,
  currentName,
  itemType,
  isFileOpen = false,
}: RenameDialogProps) {
  const { t } = useTranslation();
  const [newName, setNewName] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Reset state when dialog opens and set current name
  useEffect(() => {
    if (open) {
      setNewName(currentName);
      setError('');
    }
  }, [open, currentName]);

  const handleConfirm = () => {
    const trimmedName = newName.trim();

    if (!trimmedName) {
      setError(t('dialog.rename.errors.empty') || 'Name cannot be empty');
      return;
    }

    // Same name, no change needed
    if (trimmedName === currentName) {
      onClose();
      return;
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(trimmedName)) {
      setError(
        t('dialog.rename.errors.invalidChars') ||
          'Name contains invalid characters',
      );
      return;
    }

    // Check length
    if (trimmedName.length > 255) {
      setError(
        t('dialog.rename.errors.tooLong') ||
          'Name is too long (maximum 255 characters)',
      );
      return;
    }

    // Check for dot prefix
    if (trimmedName.startsWith('.')) {
      setError(
        t('dialog.rename.errors.startsWithDot') ||
          'Name cannot start with a dot',
      );
      return;
    }

    onConfirm(trimmedName);
    onClose();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleConfirm();
    } else if (event.key === 'Escape') {
      onClose();
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
        {itemType === 'file'
          ? t('dialog.rename.titleFile') || 'Rename File'
          : t('dialog.rename.titleFolder') || 'Rename Folder'}
      </DialogTitle>
      <DialogContent sx={dialogStyles.dialogContent}>
        <TextField
          autoFocus
          margin="dense"
          label={t('dialog.rename.placeholder') || 'New name'}
          fullWidth
          variant="outlined"
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
            setError(''); // Clear error when user types
          }}
          onKeyDown={handleKeyPress}
          error={!!error}
          helperText={error}
          sx={{
            ...dialogStyles.textField,
            '& .MuiFormHelperText-root': {
              color: 'var(--text-secondary)',
              '&.Mui-error': {
                color: '#ff6b6b',
              },
            },
          }}
        />
        {isFileOpen && (
          <Typography
            sx={{
              mt: 2,
              p: 1.5,
              backgroundColor: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              borderRadius: '4px',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              lineHeight: 1.5,
            }}
          >
            {t('dialog.rename.warningFileOpen') ||
              'This file is currently open. It will be saved and renamed.'}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={dialogStyles.dialogActions}>
        <Button onClick={onClose} sx={dialogStyles.cancelButton}>
          {t('dialog.actions.cancel') || 'Cancel'}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          sx={dialogStyles.confirmButton}
        >
          {t('dialog.actions.rename') || 'Rename'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
