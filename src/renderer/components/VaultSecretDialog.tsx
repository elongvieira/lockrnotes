import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  RadioGroup,
  Radio,
  Box,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { dialogStyles } from '../styles/dialogStyles';

interface VaultSecretDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (secretName: string, type: 'default' | 'json') => void;
}

export default function VaultSecretDialog({
  open,
  onClose,
  onConfirm,
}: VaultSecretDialogProps) {
  const { t } = useTranslation();
  const [secretName, setSecretName] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'default' | 'json'>(
    'default',
  );
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (open) {
      setSecretName('');
      setSelectedType('default');
      setError('');
    }
  }, [open]);

  const handleConfirm = () => {
    const trimmedName = secretName.trim();
    if (!trimmedName) {
      setError(t('dialog.folder.errors.empty') || 'Name cannot be empty');
      return;
    }
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(trimmedName)) {
      setError(
        t('dialog.folder.errors.invalidChars') ||
          'Name contains invalid characters',
      );
      return;
    }
    onConfirm(trimmedName, selectedType);
  };

  const types = [
    {
      id: 'default',
      name: t('vault.dialog.types.default.name') || 'Padrão do Vault',
      description:
        t('vault.dialog.types.default.description') ||
        'Segredo padrão do Vault usando pares de chave-valor simples.',
    },
    {
      id: 'json',
      name: t('vault.dialog.types.json.name') || 'Padrão JSON (Avançado)',
      description:
        t('vault.dialog.types.json.description') ||
        'Permite múltiplas entradas avançadas, como conexões SSH, RDP e mais opções estruturadas.',
    },
  ];

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
        {t('vault.actions.createSecret') || 'Criar segredo'}
      </DialogTitle>
      <DialogContent sx={dialogStyles.dialogContent}>
        <TextField
          autoFocus
          margin="dense"
          label={t('vault.dialog.secretName') || 'Nome do Segredo'}
          fullWidth
          variant="outlined"
          value={secretName}
          onChange={(e) => {
            setSecretName(e.target.value);
            setError('');
          }}
          onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
          error={!!error}
          helperText={error}
          sx={{
            ...dialogStyles.textField,
            mb: 3,
            mt: 1,
            '& .MuiFormHelperText-root': {
              color: 'var(--text-secondary)',
              '&.Mui-error': {
                color: '#ff6b6b',
              },
            },
          }}
        />

        <Typography variant="h6" sx={{ ...dialogStyles.headingText, mb: 2 }}>
          {t('dialog.file.typeTitle') || 'Tipo de Arquivo'}
        </Typography>
        <RadioGroup
          value={selectedType}
          onChange={(e) =>
            setSelectedType(e.target.value as 'default' | 'json')
          }
        >
          {types.map((type) => (
            <FormControlLabel
              key={type.id}
              value={type.id}
              control={<Radio sx={dialogStyles.checkboxRadio} />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box>
                    <Typography
                      sx={{
                        ...dialogStyles.primaryText,
                        fontWeight: 500,
                      }}
                    >
                      {type.name}
                    </Typography>
                    <Typography variant="body2" sx={dialogStyles.secondaryText}>
                      {type.description}
                    </Typography>
                  </Box>
                </Box>
              }
              sx={{ mb: 1, alignItems: 'flex-start' }}
            />
          ))}
        </RadioGroup>
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
