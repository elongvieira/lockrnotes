import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { dialogStyles } from '../styles/dialogStyles';
import { validateFolderName } from '../utils/validation';

interface FolderDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (folderName: string) => void;
  title?: string;
  placeholder?: string;
}

export default function FolderDialog({
  open,
  onClose,
  onConfirm,
  title,
  placeholder,
}: FolderDialogProps) {
  const { t } = useTranslation();
  const [folderName, setFolderName] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFolderName('');
      setError('');
    }
  }, [open]);

  const handleConfirm = () => {
    const trimmedName = folderName.trim();

    if (!trimmedName) {
      setError(
        t('dialog.folder.errors.empty') || 'Folder name cannot be empty',
      );
      return;
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(trimmedName)) {
      setError(
        t('dialog.folder.errors.invalidChars') ||
          'Folder name contains invalid characters',
      );
      return;
    }

    onConfirm(trimmedName);
    onClose();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
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
        {title || t('dialog.folder.title') || 'Create New Folder'}
      </DialogTitle>
      <DialogContent sx={dialogStyles.dialogContent}>
        <TextField
          autoFocus
          margin="dense"
          label={placeholder || t('dialog.folder.placeholder') || 'Folder name'}
          fullWidth
          variant="outlined"
          value={folderName}
          onChange={(e) => {
            setFolderName(e.target.value);
            setError(''); // Clear error when user types
          }}
          onKeyPress={handleKeyPress}
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
          {t('dialog.actions.create') || 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

FolderDialog.defaultProps = {
  title: undefined,
  placeholder: undefined,
};
