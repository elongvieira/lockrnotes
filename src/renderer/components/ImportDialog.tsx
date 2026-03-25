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
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useTranslation } from 'react-i18next';
import { dialogStyles } from '../styles/dialogStyles';
import { fileCreationService } from '../services/fileCreationService';
import type { ImportFileInfo } from '../../main/preload/importApi';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  files: ImportFileInfo[];
  onImportComplete: () => void;
}

export default function ImportDialog({
  open,
  onClose,
  files,
  onImportComplete,
}: ImportDialogProps) {
  const { t } = useTranslation();
  const [destinationPath, setDestinationPath] = useState<string>('');
  const [notesRoot, setNotesRoot] = useState<string | null>(null);
  const [encrypted, setEncrypted] = useState<boolean>(false);
  const [encryptionType, setEncryptionType] = useState<string>('managed');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (open) {
      setDestinationPath('');
      setEncrypted(false);
      setEncryptionType('managed');
      setPassword('');
      setConfirmPassword('');
      setErrors({});
      setImporting(false);
      // Load the configured notes root so we can validate the destination
      window.importAPI
        .getNotesRootPath()
        .then((root) => {
          setNotesRoot(root);
          return root;
        })
        .catch(() => {});
    }
  }, [open]);

  const handleBrowseDestination = async () => {
    try {
      const result = await window.importAPI.selectDestinationFolder();
      if (!result.canceled && result.folderPath) {
        if (result.outsideRoot) {
          setErrors((prev) => ({
            ...prev,
            destination:
              t('dialog.import.errors.outsideRoot') ||
              `A pasta deve estar dentro de: ${result.notesRoot}`,
          }));
          // Still show the path so the user sees what they picked
          setDestinationPath(result.folderPath);
        } else {
          setDestinationPath(result.folderPath);
          setErrors((prev) => ({ ...prev, destination: '' }));
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error selecting destination folder:', err);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!destinationPath.trim()) {
      newErrors.destination =
        t('dialog.import.errors.emptyDestination') ||
        'Selecione a pasta de destino';
    } else if (notesRoot) {
      // Client-side path confinement check (main process enforces the same rule)
      const sep = notesRoot.includes('\\') ? '\\' : '/';
      const root = notesRoot.endsWith(sep) ? notesRoot : notesRoot + sep;
      const dest = destinationPath;
      const destNorm = dest.endsWith(sep) ? dest : dest + sep;
      const isInside =
        dest === notesRoot ||
        destNorm.toLowerCase().startsWith(root.toLowerCase());
      if (!isInside) {
        newErrors.destination =
          t('dialog.import.errors.outsideRoot') ||
          `A pasta deve estar dentro de: ${notesRoot}`;
      }
    }

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

  const handleConfirm = async () => {
    if (!validateForm()) return;

    setImporting(true);
    let successCount = 0;
    const importErrors: string[] = [];

    try {
      for (const file of files) {
        try {
          let { content } = file;
          let outputFilename = file.name;

          if (encrypted) {
            // Determine extension: keep original ext, but rename output ext
            const originalExt = file.ext || '.txt';
            const encryptedExt =
              fileCreationService.getEncryptedExtension(originalExt);
            const baseName = file.name.endsWith(originalExt)
              ? file.name.slice(0, -originalExt.length)
              : file.name;
            outputFilename = `${baseName}${encryptedExt}`;

            const destFilePath =
              `${destinationPath}\\${outputFilename}`.replace(/\\/g, '/');

            if (encryptionType === 'managed') {
              const encryptedData = await window.encryptionAPI.encryptContent(
                content,
                destFilePath,
                originalExt,
              );
              content = JSON.stringify(encryptedData, null, 2);
            } else if (encryptionType === 'manual' && password) {
              const result = await window.manualEncryptionAPI.encryptContent(
                content,
                password,
                originalExt,
              );
              if (!result.success || !result.data) {
                throw new Error(result.error || 'Encryption failed');
              }
              content = JSON.stringify(result.data, null, 2);
            }
          }

          // Build final path using path separator
          const sep = destinationPath.includes('\\') ? '\\' : '/';
          const finalPath = `${destinationPath}${sep}${outputFilename}`;

          // Check for conflicts
          const exists = await window.importAPI.fileExists(finalPath);
          if (exists) {
            importErrors.push(
              t('dialog.import.errors.fileExists', { name: outputFilename }) ||
                `Arquivo "${outputFilename}" já existe no destino`,
            );
            // eslint-disable-next-line no-continue
            continue;
          }

          const writeResult = await window.importAPI.writeFile(
            finalPath,
            content,
          );
          if (writeResult.success) {
            successCount += 1;
          } else {
            importErrors.push(
              `${outputFilename}: ${writeResult.error || 'Unknown error'}`,
            );
          }
        } catch (fileErr) {
          importErrors.push(
            `${file.name}: ${fileErr instanceof Error ? fileErr.message : 'Unknown error'}`,
          );
        }
      }

      if (successCount > 0) {
        window.dispatchEvent(
          new CustomEvent('show-notification', {
            detail: {
              message:
                t('notifications.importSuccess', { count: successCount }) ||
                `${successCount} arquivo(s) importado(s) com sucesso`,
              severity: 'success',
            },
          }),
        );
        onImportComplete();
      }

      if (importErrors.length > 0) {
        window.dispatchEvent(
          new CustomEvent('show-notification', {
            detail: {
              message:
                t('notifications.importPartialError', {
                  errors: importErrors.join('; '),
                }) || `Erros: ${importErrors.join('; ')}`,
              severity:
                importErrors.length === files.length ? 'error' : 'warning',
            },
          }),
        );
      }

      if (successCount > 0 || importErrors.length === 0) {
        onClose();
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          ...dialogStyles.dialogPaper,
          minHeight: '500px',
        },
      }}
    >
      <DialogTitle sx={dialogStyles.dialogTitle}>
        {t('dialog.import.title') || 'Importar Arquivos'}
      </DialogTitle>

      <DialogContent
        sx={
          {
            ...dialogStyles.dialogContent,
            ...dialogStyles.scrollbar,
          } as any
        }
      >
        {/* Files list */}
        <Typography variant="h6" sx={{ ...dialogStyles.headingText, mb: 1 }}>
          {t('dialog.import.filesToImport') || 'Arquivos selecionados'}
          <Chip
            label={files.length}
            size="small"
            sx={{
              ml: 1,
              backgroundColor: 'var(--primary-blue)',
              color: '#fff',
            }}
          />
        </Typography>
        <List
          dense
          sx={{
            ...(dialogStyles as any).backgroundContainer,
            borderRadius: 'var(--border-radius-md)',
            mb: 3,
            maxHeight: 160,
            overflowY: 'auto',
          }}
        >
          {files.map((file) => (
            <ListItem key={file.path} disableGutters sx={{ px: 1 }}>
              <InsertDriveFileIcon
                fontSize="small"
                sx={{ mr: 1, color: 'var(--primary-blue)' }}
              />
              <ListItemText
                primary={file.name}
                secondary={file.path}
                primaryTypographyProps={{ sx: dialogStyles.primaryText }}
                secondaryTypographyProps={{ sx: dialogStyles.secondaryText }}
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2, ...dialogStyles.divider }} />

        {/* Destination folder */}
        <Typography variant="h6" sx={{ ...dialogStyles.headingText, mb: 1 }}>
          {t('dialog.import.destination') || 'Pasta de destino'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <TextField
            fullWidth
            placeholder={
              t('dialog.import.destinationPlaceholder') ||
              'Selecione a pasta de destino...'
            }
            value={destinationPath}
            onChange={(e) => setDestinationPath(e.target.value)}
            error={!!errors.destination}
            helperText={errors.destination}
            sx={dialogStyles.textField}
            slotProps={{ input: { readOnly: true } }}
          />
          <IconButton
            onClick={handleBrowseDestination}
            sx={{ color: 'var(--primary-blue)', flexShrink: 0 }}
            title={t('dialog.import.browseDestination') || 'Selecionar pasta'}
          >
            <FolderOpenIcon />
          </IconButton>
        </Box>

        <Divider sx={{ my: 2, ...dialogStyles.divider }} />

        {/* Encryption options */}
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
        <Button
          onClick={onClose}
          sx={dialogStyles.cancelButton}
          disabled={importing}
        >
          {t('dialog.actions.cancel') || 'Cancelar'}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          sx={dialogStyles.confirmButton}
          disabled={importing || files.length === 0}
        >
          {importing
            ? t('dialog.import.importing') || 'Importando...'
            : t('dialog.import.confirmButton') || 'Importar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
