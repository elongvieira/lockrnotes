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
  Typography,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import { useTranslation } from 'react-i18next';
import { dialogStyles } from '../styles/dialogStyles';

interface MoveResult {
  success: boolean;
  message?: string;
}

interface MoveDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (destinationPath: string) => Promise<MoveResult> | MoveResult;
  currentPath: string;
  itemName: string;
  itemType: 'file' | 'folder';
}

export default function MoveDialog({
  open,
  onClose,
  onConfirm,
  currentPath,
  itemName,
  itemType,
}: MoveDialogProps) {
  const { t } = useTranslation();
  const [destinationPath, setDestinationPath] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setDestinationPath('');
      setError('');
    }
  }, [open]);

  const handleBrowseFolder = async () => {
    try {
      // prefer the currentPath as initial folder, fall back to destinationPath
      const initial = destinationPath || currentPath || undefined;
      const selectedPath = await (window as any).electron.window.selectFolder(
        initial,
      );
      if (selectedPath) {
        setDestinationPath(selectedPath);
        setError('');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error selecting folder:', err);
    }
  };

  const handleConfirm = async () => {
    const trimmedPath = destinationPath.trim();

    if (!trimmedPath) {
      setError(
        t('dialog.move.errors.emptyPath') ||
          'Please select a destination folder',
      );
      return;
    }

    // Check if trying to move to the same location
    if (trimmedPath === currentPath) {
      setError(
        t('dialog.move.errors.sameLocation') ||
          'Destination is the same as current location',
      );
      return;
    }

    try {
      const result = await onConfirm(trimmedPath);
      if (result && !result.success) {
        setError(
          result.message ||
            t('dialog.move.errors.failed') ||
            'Failed to move item',
        );
        return;
      }

      // success
      onClose();
    } catch {
      setError(t('dialog.move.errors.failed') || 'Failed to move item');
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
          ? t('dialog.move.titleFile') || 'Move File'
          : t('dialog.move.titleFolder') || 'Move Folder'}
      </DialogTitle>
      <DialogContent sx={dialogStyles.dialogContent}>
        <Box sx={{ mt: 3, mb: 1 }}>
          <Typography
            variant="body2"
            sx={{ mb: 0.5, color: 'var(--text-secondary)' }}
          >
            {t('dialog.move.itemName') || 'Item:'}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              p: 1.5,
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '4px',
              color: 'var(--text-primary)',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
            }}
          >
            {itemName}
          </Typography>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Typography
            variant="body2"
            sx={{ mb: 0.5, color: 'var(--text-secondary)' }}
          >
            {t('dialog.move.currentLocation') || 'Current location:'}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              p: 1.5,
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '4px',
              color: 'var(--text-primary)',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              wordBreak: 'break-all',
            }}
          >
            {currentPath}
          </Typography>
        </Box>

        <Box>
          <Typography
            variant="body2"
            sx={{ mb: 0.5, color: 'var(--text-secondary)' }}
          >
            {t('dialog.move.destination') || 'Move to:'}
          </Typography>
          <TextField
            fullWidth
            placeholder={
              t('dialog.move.destinationPlaceholder') ||
              'Select destination folder'
            }
            variant="outlined"
            value={destinationPath}
            onChange={(e) => {
              setDestinationPath(e.target.value);
              setError('');
            }}
            error={!!error}
            helperText={error}
            sx={{
              ...dialogStyles.textField,
              '& .MuiInputBase-input': {
                fontFamily: 'monospace',
                fontSize: '0.9rem',
              },
            }}
            slotProps={{
              input: {
                endAdornment: (
                  <IconButton
                    onClick={handleBrowseFolder}
                    size="small"
                    sx={{ mr: 1 }}
                    title={t('dialog.move.browse') || 'Browse'}
                  >
                    <FolderIcon sx={{ color: 'var(--primary-blue)' }} />
                  </IconButton>
                ),
              },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={dialogStyles.dialogActions}>
        <Button onClick={onClose} sx={dialogStyles.cancelButton}>
          {t('dialog.actions.cancel') || 'Cancel'}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          sx={dialogStyles.confirmButton}
          disabled={!destinationPath.trim()}
        >
          {t('dialog.actions.move') || 'Move'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
