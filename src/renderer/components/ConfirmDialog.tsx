/* eslint-disable react/require-default-props */
import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { dialogStyles } from '../styles/dialogStyles';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDialog({
  open,
  title = undefined,
  message = undefined,
  confirmLabel = undefined,
  cancelLabel = undefined,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const dialogTitle = title || t('dialog.confirm.title');
  const dialogMessage = message || t('dialog.confirm.message');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: dialogStyles.dialogPaper }}
    >
      <DialogTitle sx={dialogStyles.dialogTitle}>{dialogTitle}</DialogTitle>
      <DialogContent sx={dialogStyles.dialogContent}>
        <Typography sx={dialogStyles.primaryText} variant="body2">
          {dialogMessage}
        </Typography>
      </DialogContent>
      <DialogActions sx={dialogStyles.dialogActions}>
        <Button onClick={onClose} sx={dialogStyles.cancelButton}>
          {cancelLabel || t('dialog.actions.cancel')}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={dialogStyles.confirmButton}
        >
          {confirmLabel || t('dialog.actions.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
