import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { dialogStyles } from '../styles/dialogStyles';
import { getTermsSections } from '../terms/termsDocument';
import {
  openExternalUrl,
  PROJECT_LICENSE_URL,
} from '../constants/projectLinks';

interface TermsOfUseDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function TermsOfUseDialog({
  open,
  onClose,
}: TermsOfUseDialogProps) {
  const { t, i18n } = useTranslation();
  const sections = getTermsSections(i18n.language);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: dialogStyles.dialogPaper }}
    >
      <DialogTitle sx={dialogStyles.dialogTitle}>
        {t('terms.fullTitle') || 'Termos de Uso completos'}
      </DialogTitle>
      <DialogContent
        sx={
          {
            ...dialogStyles.dialogContent,
            ...dialogStyles.scrollbar,
          } as any
        }
      >
        <Typography
          variant="body2"
          sx={{ ...dialogStyles.secondaryText, mb: 2, lineHeight: 1.6 }}
        >
          {t('terms.fullIntro') ||
            'Leia atentamente antes de aceitar. Estes termos regem o uso do Lockr Notes neste dispositivo.'}
        </Typography>
        <Typography variant="body2" sx={{ ...dialogStyles.primaryText, mb: 2 }}>
          {t('terms.licensePrefix') || 'Licença do software:'}{' '}
          <Button
            type="button"
            onClick={() => openExternalUrl(PROJECT_LICENSE_URL)}
            sx={dialogStyles.externalTextLink}
          >
            {t('terms.viewMitLicense') || 'MIT — ver LICENSE no GitHub'}
          </Button>
        </Typography>
        {sections.map((section, index) => (
          <Box key={section.id} sx={{ mb: 2.5 }}>
            <Typography
              variant="subtitle1"
              sx={{ ...dialogStyles.headingText, mb: 1 }}
            >
              {section.title}
            </Typography>
            {section.paragraphs.map((paragraph) => (
              <Typography
                key={paragraph.slice(0, 40)}
                variant="body2"
                sx={{
                  ...dialogStyles.primaryText,
                  mb: 1.25,
                  lineHeight: 1.65,
                }}
              >
                {paragraph}
              </Typography>
            ))}
            {index < sections.length - 1 ? (
              <Divider sx={{ mt: 1.5, ...dialogStyles.divider }} />
            ) : null}
          </Box>
        ))}
      </DialogContent>
      <DialogActions sx={dialogStyles.dialogActions}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={dialogStyles.confirmButton}
        >
          {t('terms.closeFull') || 'Fechar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
