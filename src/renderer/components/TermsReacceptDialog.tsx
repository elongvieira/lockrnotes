import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { dialogStyles } from '../styles/dialogStyles';
import TermsAcceptanceSection from './TermsAcceptanceSection';
import { buildTermsAcceptanceRecord } from '../terms/termsDocument';
import { fileSystemService } from '../services/fileSystemService';

interface TermsReacceptDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function TermsReacceptDialog({
  open,
  onClose,
}: TermsReacceptDialogProps) {
  const { t, i18n } = useTranslation();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!termsAccepted) {
      setShowTermsError(true);
      return;
    }

    try {
      setSaving(true);
      const termsAcceptance = await buildTermsAcceptanceRecord(i18n.language);
      const success = await fileSystemService.updateConfig({ termsAcceptance });
      if (success) {
        onClose();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save terms acceptance:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {}}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{ sx: dialogStyles.dialogPaper }}
    >
      <DialogTitle sx={dialogStyles.dialogTitle}>
        {t('terms.reacceptTitle') || 'Atualização dos Termos de Uso'}
      </DialogTitle>
      <DialogContent sx={dialogStyles.dialogContent}>
        <Typography
          variant="body2"
          sx={{ ...dialogStyles.primaryText, mb: 2, lineHeight: 1.6 }}
        >
          {t('terms.reacceptMessage') ||
            'Os Termos de Uso foram atualizados. Revise o resumo, leia o texto completo se desejar e aceite para continuar usando o Lockr Notes.'}
        </Typography>
        <TermsAcceptanceSection
          accepted={termsAccepted}
          onAcceptedChange={(value) => {
            setTermsAccepted(value);
            if (value) {
              setShowTermsError(false);
            }
          }}
          showError={showTermsError}
        />
      </DialogContent>
      <DialogActions sx={dialogStyles.dialogActions}>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={saving || !termsAccepted}
          sx={dialogStyles.confirmButton}
        >
          {t('terms.continue') || 'Continuar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
