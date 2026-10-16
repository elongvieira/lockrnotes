import { useState } from 'react';
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
import logo from '../../../assets/logo_a.png';
import TermsOfUseDialog from './TermsOfUseDialog';
import {
  openExternalUrl,
  PROJECT_ISSUES_URL,
  PROJECT_LICENSE_URL,
  PROJECT_REPOSITORY_URL,
} from '../constants/projectLinks';

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

function AboutLink({ label, url }: { label: string; url: string }) {
  return (
    <Button
      type="button"
      onClick={() => openExternalUrl(url)}
      sx={dialogStyles.externalTextLink}
    >
      {label}
    </Button>
  );
}

export default function AboutDialog({ open, onClose }: AboutDialogProps) {
  const { t } = useTranslation();
  const [termsOpen, setTermsOpen] = useState(false);
  const version = process.env.APP_VERSION || '0.0.0';

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: dialogStyles.dialogPaper }}
      >
        <DialogTitle sx={dialogStyles.dialogTitle}>
          {t('about.title') || 'Sobre o Lockr Notes'}
        </DialogTitle>
        <DialogContent sx={dialogStyles.dialogContent}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              mb: 2,
            }}
          >
            <Box
              component="img"
              src={logo}
              alt="Lockr Notes"
              sx={{
                height: 48,
                width: 'auto',
                maxWidth: '100%',
                objectFit: 'contain',
                mb: 1,
              }}
            />
            <Typography
              variant="body2"
              sx={{ ...dialogStyles.secondaryText, mt: 0.5 }}
            >
              {t('about.version', { version }) || `Versão ${version}`}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                ...dialogStyles.primaryText,
                mt: 1.5,
                lineHeight: 1.6,
                maxWidth: 420,
              }}
            >
              {t('about.description') ||
                'Aplicativo de anotações local, com criptografia opcional e código aberto.'}
            </Typography>
          </Box>

          <Divider sx={{ my: 2, ...dialogStyles.divider }} />

          <Box sx={{ display: 'grid', rowGap: 1.25 }}>
            <Typography variant="body2" sx={dialogStyles.primaryText}>
              {t('about.authorLabel') || 'Autor:'} Elon Gomes Vieira
            </Typography>
            <Typography variant="body2" sx={dialogStyles.primaryText}>
              {t('about.licenseLabel') || 'Licença:'}{' '}
              <AboutLink
                label={t('about.licenseLink') || 'MIT — ver LICENSE no GitHub'}
                url={PROJECT_LICENSE_URL}
              />
            </Typography>
            <Typography variant="body2" sx={dialogStyles.primaryText}>
              {t('about.repositoryLabel') || 'Código-fonte:'}{' '}
              <AboutLink
                label="github.com/elongvieira/lockrnotes"
                url={PROJECT_REPOSITORY_URL}
              />
            </Typography>
            <Typography variant="body2" sx={dialogStyles.primaryText}>
              {t('about.issuesLabel') || 'Problemas e sugestões:'}{' '}
              <AboutLink
                label={t('about.issuesLink') || 'Abrir uma issue'}
                url={PROJECT_ISSUES_URL}
              />
            </Typography>
            <Typography variant="body2" sx={dialogStyles.primaryText}>
              {t('about.termsLabel') || 'Termos de uso:'}{' '}
              <Button
                type="button"
                onClick={() => setTermsOpen(true)}
                sx={dialogStyles.externalTextLink}
              >
                {t('about.termsLink') || 'Ler os termos'}
              </Button>
            </Typography>
          </Box>

          <Typography
            variant="caption"
            sx={{
              ...dialogStyles.secondaryText,
              display: 'block',
              mt: 2.5,
              textAlign: 'center',
            }}
          >
            {t('about.copyright') || '© 2025 Elon Gomes Vieira'}
          </Typography>
        </DialogContent>
        <DialogActions sx={dialogStyles.dialogActions}>
          <Button onClick={onClose} sx={dialogStyles.cancelButton}>
            {t('about.close') || 'Fechar'}
          </Button>
        </DialogActions>
      </Dialog>
      <TermsOfUseDialog open={termsOpen} onClose={() => setTermsOpen(false)} />
    </>
  );
}
