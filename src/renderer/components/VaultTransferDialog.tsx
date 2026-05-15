import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { dialogStyles } from '../styles/dialogStyles';

interface TransferResult {
  success: boolean;
  message?: string;
}

interface VaultTransferDialogProps {
  open: boolean;
  mode: 'copy' | 'move';
  itemName: string;
  currentPath: string;
  onClose: () => void;
  onConfirm: (
    destinationPath: string,
  ) => Promise<TransferResult> | TransferResult;
}

export default function VaultTransferDialog({
  open,
  mode,
  itemName,
  currentPath,
  onClose,
  onConfirm,
}: VaultTransferDialogProps) {
  const { t } = useTranslation();
  const [destinationPath, setDestinationPath] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDestinationPath(currentPath);
      setError('');
      setSubmitting(false);
    }
  }, [open, currentPath]);

  const handleConfirm = async () => {
    const rawPath = destinationPath.trim();
    if (!rawPath) {
      setError(
        t('vault.transferDialog.errors.emptyPath') ||
          'Please provide a destination path',
      );
      return;
    }

    if (rawPath.endsWith('/')) {
      setError(
        t('vault.transferDialog.errors.invalidPath') ||
          'Destination path cannot end with /',
      );
      return;
    }

    const normalizedPath = rawPath.replace(/^\/+/, '');

    if (mode === 'move' && normalizedPath === currentPath) {
      setError(
        t('vault.transferDialog.errors.sameLocation') ||
          'Destination is the same as current location',
      );
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const result = await onConfirm(normalizedPath);
      if (!result.success) {
        setError(
          result.message ||
            t('vault.transferDialog.errors.failed') ||
            'Operation failed',
        );
        return;
      }

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const title =
    mode === 'copy'
      ? t('vault.transferDialog.copyTitle') || 'Copy Secret'
      : t('vault.transferDialog.moveTitle') || 'Move Secret';

  const actionLabel =
    mode === 'copy'
      ? t('contextMenu.copy') || 'Copy'
      : t('contextMenu.move') || 'Move';

  return (
    <Dialog
      open={open}
      onClose={() => !submitting && onClose()}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: dialogStyles.dialogPaper }}
    >
      <DialogTitle sx={dialogStyles.dialogTitle}>{title}</DialogTitle>

      <DialogContent sx={dialogStyles.dialogContent}>
        <Box sx={{ mt: 2, mb: 2 }}>
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

        <Box sx={{ mb: 2 }}>
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

        <TextField
          autoFocus
          fullWidth
          label={
            t('vault.transferDialog.destinationLabel') || 'Destination in Vault'
          }
          placeholder={
            t('vault.transferDialog.destinationPlaceholder') ||
            'e.g. folder/subfolder/new-secret-name'
          }
          helperText={
            error ||
            t('vault.transferDialog.destinationHelper') ||
            'Provide the full destination path in Vault.'
          }
          error={!!error}
          value={destinationPath}
          onChange={(e) => {
            setDestinationPath(e.target.value);
            if (error) setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleConfirm();
            }
          }}
          sx={dialogStyles.textField}
        />
      </DialogContent>

      <DialogActions sx={dialogStyles.dialogActions}>
        <Button
          onClick={onClose}
          disabled={submitting}
          sx={dialogStyles.cancelButton}
        >
          {t('dialog.actions.cancel') || 'Cancel'}
        </Button>
        <Button
          onClick={() => {
            handleConfirm();
          }}
          disabled={submitting || !destinationPath.trim()}
          variant="contained"
          sx={dialogStyles.confirmButton}
        >
          {actionLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
