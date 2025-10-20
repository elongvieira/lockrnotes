import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Box,
  Typography,
  Divider,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { fileSystemService } from '../services/fileSystemService';
import { fileCreationService } from '../services/fileCreationService';
import { dialogStyles } from '../styles/dialogStyles';
import type { FileCreationData } from '../services/fileCreationService';

interface FileCreationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (fileData: FileCreationData) => void;
}

export default function FileCreationDialog({
  open,
  onClose,
  onConfirm,
}: FileCreationDialogProps) {
  const { t } = useTranslation();
  const [filename, setFilename] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('text');
  const [encrypted, setEncrypted] = useState<boolean>(false);
  const [encryptionType, setEncryptionType] = useState<string>('managed');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Generate file types with translations
  const fileTypes = [
    {
      id: 'text',
      name: t('dialog.file.types.text.name') || 'Texto',
      description:
        t('dialog.file.types.text.description') ||
        'Arquivo de texto simples para anotações e documentos.',
      preview:
        t('dialog.file.types.text.preview') ||
        '📝 Lorem ipsum dolor sit amet...\n\nParagrafo 2 com mais texto.',
    },
    {
      id: 'keyvalue',
      name: t('dialog.file.types.keyvalue.name') || 'Chave/Valores',
      description:
        t('dialog.file.types.keyvalue.description') ||
        'Dados estruturados em formato chave-valor.',
      preview:
        t('dialog.file.types.keyvalue.preview') ||
        'nome: Sistema tal\nusuário: user123\nsenha: ••••••••',
    },
  ];

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFilename('');
      setSelectedType('text');
      setEncrypted(false);
      setEncryptionType('managed');
      setPassword('');
      setConfirmPassword('');
      setErrors({});
    }
  }, [open]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate filename
    if (!filename.trim()) {
      newErrors.filename =
        t('dialog.file.errors.emptyName') || 'Nome do arquivo é obrigatório';
    } else {
      const invalidChars = /[<>:"/\\|?*]/;
      if (invalidChars.test(filename)) {
        newErrors.filename =
          t('dialog.file.errors.invalidChars') ||
          'Nome contém caracteres inválidos';
      }
    }

    // Validate manual encryption passwords
    if (encrypted && encryptionType === 'manual') {
      if (!password) {
        newErrors.password =
          t('dialog.file.errors.emptyPassword') || 'Senha é obrigatória';
      } else if (password.length < 6) {
        newErrors.password =
          t('dialog.file.errors.weakPassword') ||
          'Senha deve ter pelo menos 6 caracteres';
      }

      if (password !== confirmPassword) {
        newErrors.confirmPassword =
          t('dialog.file.errors.passwordMismatch') || 'Senhas não coincidem';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validateForm()) return;
    (async () => {
      // Prepare final filename including extension (using template info from service)
      const cleanName = filename.trim();
      const template = fileCreationService.getTemplate(selectedType);
      const originalExtension = template ? template.extension : '';
      // If user requested managed encryption, use the encrypted wrapper extension
      const extension =
        encrypted && encryptionType === 'managed'
          ? fileCreationService.getEncryptedExtension(originalExtension)
          : originalExtension;
      const finalFilename = `${cleanName}${extension}`;

      try {
        const notesDir = await fileSystemService.getDefaultNotesDirectory();
        const exists = await fileSystemService.itemExists(
          notesDir,
          finalFilename,
        );
        if (exists) {
          setErrors((prev) => ({
            ...prev,
            filename:
              t('dialog.file.errors.fileExists') ||
              'A file with that name already exists',
          }));
          return;
        }

        const fileData: FileCreationData = {
          filename: filename.trim(),
          type: selectedType as 'text' | 'keyvalue',
          encrypted,
          encryptionType: encrypted
            ? (encryptionType as 'managed' | 'manual')
            : undefined,
          password:
            encrypted && encryptionType === 'manual' ? password : undefined,
        };

        onConfirm(fileData);
        onClose();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error checking file existence:', err);
        setErrors((prev) => ({
          ...prev,
          filename: t('dialog.file.errors.invalidChars') || 'Invalid filename',
        }));
      }
    })();
  };

  const selectedTypeData = fileTypes.find((type) => type.id === selectedType);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          ...dialogStyles.dialogPaper,
          minHeight: '600px',
        },
      }}
    >
      <DialogTitle sx={dialogStyles.dialogTitle}>
        {t('dialog.file.title') || 'Criar Novo Arquivo'}
      </DialogTitle>

      <DialogContent sx={dialogStyles.dialogContent}>
        {/* Filename Input */}
        <TextField
          autoFocus
          fullWidth
          label={t('dialog.file.filename') || 'Nome do arquivo'}
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          error={!!errors.filename}
          helperText={errors.filename}
          sx={{
            mb: 3,
            mt: 2,
            ...dialogStyles.textField,
          }}
        />

        {/* File Type Selection */}
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          {/* Left side - Type options */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{ ...dialogStyles.headingText, mb: 2 }}
            >
              {t('dialog.file.typeTitle') || 'Tipo de Arquivo'}
            </Typography>
            <RadioGroup
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {fileTypes.map((type) => {
                return (
                  <FormControlLabel
                    key={type.id}
                    value={type.id}
                    control={<Radio sx={dialogStyles.checkboxRadio} />}
                    label={
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Box>
                          <Typography
                            sx={{
                              ...dialogStyles.primaryText,
                              fontWeight: 500,
                            }}
                          >
                            {type.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={dialogStyles.secondaryText}
                          >
                            {type.description}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    sx={{ mb: 1, alignItems: 'flex-start' }}
                  />
                );
              })}
            </RadioGroup>
          </Box>

          {/* Right side - Preview */}
          <Box sx={{ flex: 1, pl: 2 }}>
            <Typography
              variant="h6"
              sx={{ ...dialogStyles.headingText, mb: 2 }}
            >
              {t('dialog.file.previewTitle') || 'Exemplo'}
            </Typography>
            <Box
              sx={{
                ...dialogStyles.backgroundContainer,
                p: 2,
                minHeight: '120px',
                fontFamily: 'monospace',
                fontSize: '14px',
                color: 'var(--text-primary)',
                whiteSpace: 'pre-line',
              }}
            >
              {selectedTypeData?.preview}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3, ...dialogStyles.divider }} />

        {/* Encryption Options */}
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={encrypted}
                onChange={(e) => setEncrypted(e.target.checked)}
                sx={dialogStyles.checkboxRadio}
              />
            }
            label={
              <Typography sx={dialogStyles.primaryText}>
                {t('dialog.file.encryptOption') || 'Criptografar arquivo'}
              </Typography>
            }
          />
        </Box>

        {encrypted && (
          <Box sx={{ ml: 4, mb: 2 }}>
            <RadioGroup
              value={encryptionType}
              onChange={(e) => setEncryptionType(e.target.value)}
              sx={{ mb: 2 }}
            >
              <FormControlLabel
                value="managed"
                control={<Radio sx={dialogStyles.checkboxRadio} />}
                label={
                  <Typography sx={dialogStyles.primaryText}>
                    {t('dialog.file.managedEncryption') ||
                      'Gerenciado pelo programa'}
                  </Typography>
                }
              />
              <FormControlLabel
                value="manual"
                control={<Radio sx={dialogStyles.checkboxRadio} />}
                label={
                  <Typography sx={dialogStyles.primaryText}>
                    {t('dialog.file.manualEncryption') || 'Chave manual'}
                  </Typography>
                }
              />
            </RadioGroup>

            {encryptionType === 'manual' && (
              <>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    type="password"
                    label={t('dialog.file.password') || 'Senha'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={!!errors.password}
                    helperText={errors.password}
                    fullWidth
                    sx={dialogStyles.textField}
                  />
                  <TextField
                    type="password"
                    label={
                      t('dialog.file.confirmPassword') || 'Confirmar senha'
                    }
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                    fullWidth
                    sx={dialogStyles.textField}
                  />
                </Box>
                <Alert severity="warning" sx={dialogStyles.warningAlert}>
                  {t('dialog.file.passwordWarning') ||
                    'Anote a senha em local seguro. Não será possível recuperar o arquivo sem ela.'}
                </Alert>
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={dialogStyles.dialogActions}>
        <Button onClick={onClose} sx={dialogStyles.cancelButton}>
          {t('dialog.actions.cancel') || 'Cancelar'}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          sx={dialogStyles.confirmButton}
        >
          {t('dialog.actions.create') || 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
