import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  Alert,
  Link,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { dialogStyles } from '../styles/dialogStyles';
import { getTermsSummary } from '../terms/termsDocument';
import TermsOfUseDialog from './TermsOfUseDialog';
import {
  openExternalUrl,
  PROJECT_LICENSE_URL,
} from '../constants/projectLinks';

interface TermsAcceptanceSectionProps {
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  showError?: boolean;
}

export default function TermsAcceptanceSection({
  accepted,
  onAcceptedChange,
  showError = false,
}: TermsAcceptanceSectionProps) {
  const { t, i18n } = useTranslation();
  const [fullTermsOpen, setFullTermsOpen] = useState(false);
  const summary = getTermsSummary(i18n.language);

  return (
    <Box
      sx={{
        mt: 2,
        p: 2,
        borderRadius: 'var(--border-radius-md)',
        backgroundColor: 'var(--bg-tree-container)',
        border: '1px solid var(--border-color)',
      }}
    >
      <Typography
        variant="body2"
        sx={{ ...dialogStyles.primaryText, fontWeight: 600, mb: 1 }}
      >
        {t('terms.title') || 'Termos de Uso'}
      </Typography>
      <Typography
        variant="caption"
        sx={{ ...dialogStyles.secondaryText, display: 'block', mb: 1.5 }}
      >
        {t('terms.summaryIntro') ||
          'Resumo do que você aceita ao continuar:'}
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.5, mb: 1.5 }}>
        {summary.map((item) => (
          <Typography
            key={item}
            component="li"
            variant="body2"
            sx={{ ...dialogStyles.primaryText, mb: 0.75, lineHeight: 1.55 }}
          >
            {item}
          </Typography>
        ))}
      </Box>
      <Button
        variant="outlined"
        size="small"
        onClick={() => setFullTermsOpen(true)}
        sx={{ mb: 1.5 }}
      >
        {t('terms.readFull') || 'Ler termos completos'}
      </Button>
      <FormControlLabel
        control={
          <Checkbox
            checked={accepted}
            onChange={(event) => onAcceptedChange(event.target.checked)}
            sx={dialogStyles.checkboxRadio}
          />
        }
        label={
          <Typography variant="body2" sx={dialogStyles.primaryText}>
            {t('terms.acceptLabel') ||
              'Li e aceito os Termos de Uso do Lockr Notes'}
          </Typography>
        }
      />
      <Typography
        variant="caption"
        sx={{ ...dialogStyles.secondaryText, display: 'block', mt: 1 }}
      >
        {t('terms.licensePrefix') || 'Licença do software:'}{' '}
        <Link
          component="button"
          type="button"
          onClick={() => openExternalUrl(PROJECT_LICENSE_URL)}
          sx={{ ...dialogStyles.externalTextLink, fontSize: 'inherit' }}
        >
          {t('terms.viewMitLicense') || 'MIT — ver LICENSE no GitHub'}
        </Link>
      </Typography>
      {showError && !accepted ? (
        <Alert severity="warning" sx={{ mt: 1.5, ...dialogStyles.warningAlert }}>
          {t('terms.acceptRequired') ||
            'Você precisa aceitar os termos para continuar.'}
        </Alert>
      ) : null}
      <TermsOfUseDialog
        open={fullTermsOpen}
        onClose={() => setFullTermsOpen(false)}
      />
    </Box>
  );
}
