import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  FormControlLabel,
  Switch,
  Typography,
  Divider,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { fileSystemService } from '../services/fileSystemService';
import { dialogStyles } from '../styles/dialogStyles';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { t } = useTranslation();
  const [autoSave, setAutoSave] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  // Carregar configurações ao abrir o diálogo
  useEffect(() => {
    if (open) {
      const loadSettings = async () => {
        try {
          setLoading(true);
          const config = await fileSystemService.readConfig();
          if (config && config.autoSave !== undefined) {
            setAutoSave(config.autoSave);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to load settings:', error);
        } finally {
          setLoading(false);
        }
      };
      loadSettings();
    }
  }, [open]);

  const handleAutoSaveToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAutoSave(event.target.checked);
  };

  const handleSave = async () => {
    try {
      await fileSystemService.updateConfig({
        autoSave,
      });
      onClose();
      // Force page reload to apply settings
      window.location.reload();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          ...dialogStyles.dialogPaper,
        },
      }}
    >
      <DialogTitle sx={dialogStyles.dialogTitle}>
        {t('settings.title') || '⚙️ Configurações'}
      </DialogTitle>

      <DialogContent sx={dialogStyles.dialogContent}>
        {/* Auto-save Section */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              ...dialogStyles.headingText,
              mb: 2,
            }}
          >
            {t('settings.editor') || 'Editor'}
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={autoSave}
                onChange={handleAutoSaveToggle}
                disabled={loading}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: 'var(--primary-blue)',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: 'var(--primary-blue)',
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography
                  variant="body1"
                  sx={{ ...dialogStyles.primaryText }}
                >
                  {t('settings.autoSave') || 'Salvar automaticamente'}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    ...dialogStyles.secondaryText,
                    display: 'block',
                    mt: 0.5,
                  }}
                >
                  {t('settings.autoSaveDescription') ||
                    'Salva os arquivos automaticamente após 1.5 segundos de inatividade'}
                </Typography>
              </Box>
            }
          />
        </Box>

        <Divider sx={{ my: 2, ...dialogStyles.divider }} />
      </DialogContent>

      <DialogActions sx={dialogStyles.dialogActions}>
        <Button onClick={onClose} sx={dialogStyles.cancelButton}>
          {t('common.cancel') || 'Cancelar'}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          sx={dialogStyles.confirmButton}
        >
          {t('common.save') || 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
