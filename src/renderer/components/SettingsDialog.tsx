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
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  Radio,
  RadioGroup,
  FormControl,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { fileSystemService } from '../services/fileSystemService';
import { dialogStyles } from '../styles/dialogStyles';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

type SettingsSection = 'editor' | 'storage' | 'security';

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { t } = useTranslation();
  const [selectedSection, setSelectedSection] =
    useState<SettingsSection>('editor');
  const [autoSave, setAutoSave] = useState<boolean>(true);
  const [defaultPath, setDefaultPath] = useState<string>('');
  const [oldDefaultPath, setOldDefaultPath] = useState<string>('');
  const [keyStorageType, setKeyStorageType] = useState<string>('system');
  const [loading, setLoading] = useState<boolean>(false);
  const [showCopyDialog, setShowCopyDialog] = useState<boolean>(false);
  const [selectedNewPath, setSelectedNewPath] = useState<string>('');

  // Carregar configurações ao abrir o diálogo
  useEffect(() => {
    if (open) {
      const loadSettings = async () => {
        try {
          setLoading(true);
          const config = await fileSystemService.readConfig();
          if (config) {
            if (config.autoSave !== undefined) {
              setAutoSave(config.autoSave);
            }
            if (config.defaultPath) {
              setDefaultPath(config.defaultPath);
              setOldDefaultPath(config.defaultPath);
            }
            if (config.keyStorageType) {
              setKeyStorageType(config.keyStorageType);
            }
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

  const handleBrowseFolder = async () => {
    try {
      const selectedPath = await (window as any).electron.window.selectFolder(
        defaultPath || undefined,
      );
      if (selectedPath && selectedPath !== defaultPath) {
        setSelectedNewPath(selectedPath);
        setShowCopyDialog(true);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error selecting folder:', error);
    }
  };

  const handleCopyDialogConfirm = async (shouldCopy: boolean) => {
    if (shouldCopy) {
      try {
        setLoading(true);
        // Copy contents from old path to new path
        const success = await fileSystemService.copyFolderContent(
          oldDefaultPath,
          selectedNewPath,
        );
        if (!success) {
          throw new Error('Failed to copy folder contents');
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error copying folder:', error);
        setShowCopyDialog(false);
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }
    // Update the default path (whether copied or not)
    setDefaultPath(selectedNewPath);
    setOldDefaultPath(selectedNewPath);
    setShowCopyDialog(false);
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Check if keyStorageType has changed
      const config = await fileSystemService.readConfig();
      const oldKeyStorageType = config?.keyStorageType || 'system';

      // If keyStorageType changed, perform migration
      if (keyStorageType !== oldKeyStorageType) {
        try {
          await window.encryptionAPI.migrateKeyStorage(keyStorageType);
        } catch (migrationError) {
          // eslint-disable-next-line no-console
          console.error('Failed to migrate key storage:', migrationError);
          throw new Error(
            t('settings.keyStorageMigrationError') ||
              'Failed to migrate encryption key storage',
          );
        }
      }

      await fileSystemService.updateConfig({
        autoSave,
        defaultPath,
        keyStorageType,
      });
      setLoading(false);
      onClose();
      // Force page reload to apply settings
      window.location.reload();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save settings:', error);
      setLoading(false);
    }
  };

  const renderEditorSettings = () => (
    <Box>
      <Typography
        variant="h6"
        sx={{
          ...dialogStyles.headingText,
          mb: 3,
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
            <Typography variant="body1" sx={{ ...dialogStyles.primaryText }}>
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
  );

  const renderStorageSettings = () => (
    <Box>
      <Typography
        variant="h6"
        sx={{
          ...dialogStyles.headingText,
          mb: 2,
        }}
      >
        {t('settings.storage') || 'Armazenamento'}
      </Typography>

      <Typography variant="body2" sx={{ ...dialogStyles.secondaryText, mb: 3 }}>
        {t('welcome.storageDescription') ||
          'Escolha onde seus arquivos serão armazenados.'}
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ ...dialogStyles.primaryText, mb: 1 }}>
          {t('welcome.defaultPath') || 'Pasta Padrão'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            value={defaultPath}
            disabled
            slotProps={{
              input: {
                sx: {
                  backgroundColor: 'var(--bg-tree-container)',
                  color: 'var(--text-secondary)',
                  WebkitTextFillColor: 'var(--text-secondary)',
                  // Ensure disabled inputs keep readable color (MUI / browser often dims disabled inputs)
                  '&.Mui-disabled': {
                    WebkitTextFillColor: 'var(--text-secondary)',
                    color: 'var(--text-secondary)',
                    opacity: 1,
                  },
                  '&::placeholder': {
                    color: 'var(--border-secondary)',
                  },
                  '& fieldset': {
                    borderColor: 'var(--border-secondary)',
                  },
                },
              },
            }}
            sx={{
              // Make sure the outlined border stays consistent even when disabled
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--border-secondary)',
              },
              // Ensure the disabled input's text color is respected in the input base
              '& .MuiInputBase-input.Mui-disabled': {
                WebkitTextFillColor: 'var(--text-secondary)',
                color: 'var(--text-secondary)',
                opacity: 1,
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleBrowseFolder}
            disabled={loading}
            sx={{
              ...dialogStyles.confirmButton,
              whiteSpace: 'nowrap',
            }}
          >
            {t('settings.changeButton') || 'Alterar'}
          </Button>
        </Box>
        <Typography
          variant="caption"
          sx={{ ...dialogStyles.secondaryText, display: 'block', mt: 1 }}
        >
          {t('welcome.pathHelper') ||
            'Caminho completo onde os arquivos serão salvos'}
        </Typography>
      </Box>
    </Box>
  );

  const renderSecuritySettings = () => (
    <Box>
      <Typography
        variant="h6"
        sx={{
          ...dialogStyles.headingText,
          mb: 2,
        }}
      >
        {t('settings.security') || 'Segurança'}
      </Typography>

      <Typography variant="body2" sx={{ ...dialogStyles.secondaryText, mb: 3 }}>
        {t('welcome.keyStorageDescription') ||
          'Escolha como proteger sua chave de criptografia gerenciada.'}
      </Typography>

      <FormControl component="fieldset">
        <RadioGroup
          value={keyStorageType}
          onChange={(e) => setKeyStorageType(e.target.value)}
        >
          <FormControlLabel
            value="system"
            control={
              <Radio
                sx={{
                  color: 'var(--primary-blue)',
                  '&.Mui-checked': {
                    color: 'var(--primary-blue)',
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
                  {t('welcome.keyStorageOptions.system') ||
                    '📦 Gerenciado pelo Sistema (Padrão)'}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    ...dialogStyles.secondaryText,
                    display: 'block',
                    mt: 0.5,
                  }}
                >
                  {t('welcome.keyStorageOptions.systemPro') ||
                    '✓ Mais seguro - Chave armazenada no cofre seguro do Windows'}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    ...dialogStyles.secondaryText,
                    display: 'block',
                  }}
                >
                  {t('welcome.keyStorageOptions.systemCon') ||
                    '✗ Se apagar dados do sistema, perderá acesso aos arquivos'}
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            value="folder"
            control={
              <Radio
                sx={{
                  color: 'var(--primary-blue)',
                  '&.Mui-checked': {
                    color: 'var(--primary-blue)',
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
                  {t('welcome.keyStorageOptions.folder') || '📁 Salvo na Pasta'}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    ...dialogStyles.secondaryText,
                    display: 'block',
                    mt: 0.5,
                  }}
                >
                  {t('welcome.keyStorageOptions.folderPro') ||
                    '✓ Recuperável - Se mover a pasta, continua funcionando'}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    ...dialogStyles.secondaryText,
                    display: 'block',
                  }}
                >
                  {t('welcome.keyStorageOptions.folderCon') ||
                    '✗ Menos seguro - Qualquer um com acesso à pasta pode descriptografar'}
                </Typography>
              </Box>
            }
          />
        </RadioGroup>
      </FormControl>

      <Alert
        severity="warning"
        sx={{
          mt: 3,
          ...dialogStyles.warningAlert,
        }}
      >
        {t('settings.securityWarning') ||
          'Alterar o tipo de armazenamento de chave pode impedir o acesso a arquivos criptografados existentes.'}
      </Alert>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          ...dialogStyles.dialogPaper,
          height: '600px',
        },
      }}
    >
      <DialogTitle sx={dialogStyles.dialogTitle}>
        {t('settings.title') || '⚙️ Configurações'}
      </DialogTitle>

      <DialogContent
        sx={{
          ...dialogStyles.dialogContent,
          p: 0,
          display: 'flex',
          height: 'calc(100% - 120px)',
        }}
      >
        {/* Sidebar com lista de seções */}
        <Box
          sx={{
            width: 200,
            borderRight: '1px solid var(--border-primary)',
            ...dialogStyles.scrollbar,
            overflowY: 'auto',
          }}
        >
          <List disablePadding>
            <ListItem disablePadding>
              <ListItemButton
                selected={selectedSection === 'editor'}
                onClick={() => setSelectedSection('editor')}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(33, 150, 243, 0.12)',
                    borderRight: '2px solid var(--primary-blue)',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(33, 150, 243, 0.08)',
                  },
                }}
              >
                <ListItemText
                  primary={t('settings.editor') || 'Editor'}
                  primaryTypographyProps={{
                    sx: { ...dialogStyles.primaryText },
                  }}
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={selectedSection === 'storage'}
                onClick={() => setSelectedSection('storage')}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(33, 150, 243, 0.12)',
                    borderRight: '2px solid var(--primary-blue)',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(33, 150, 243, 0.08)',
                  },
                }}
              >
                <ListItemText
                  primary={t('settings.storage') || 'Armazenamento'}
                  primaryTypographyProps={{
                    sx: { ...dialogStyles.primaryText },
                  }}
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={selectedSection === 'security'}
                onClick={() => setSelectedSection('security')}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(33, 150, 243, 0.12)',
                    borderRight: '2px solid var(--primary-blue)',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(33, 150, 243, 0.08)',
                  },
                }}
              >
                <ListItemText
                  primary={t('settings.security') || 'Segurança'}
                  primaryTypographyProps={{
                    sx: { ...dialogStyles.primaryText },
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>

        {/* Conteúdo da seção selecionada */}
        <Box
          sx={{
            flex: 1,
            p: 3,
            ...dialogStyles.scrollbar,
            overflowY: 'auto',
          }}
        >
          {selectedSection === 'editor' && renderEditorSettings()}
          {selectedSection === 'storage' && renderStorageSettings()}
          {selectedSection === 'security' && renderSecuritySettings()}
        </Box>
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

      {/* Copy confirmation dialog */}
      <Dialog
        open={showCopyDialog}
        onClose={() => setShowCopyDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            ...dialogStyles.dialogPaper,
          },
        }}
      >
        <DialogTitle sx={dialogStyles.dialogTitle}>
          {t('settings.copyContentTitle') || 'Copiar Conteúdo'}
        </DialogTitle>
        <DialogContent sx={dialogStyles.dialogContent}>
          <Typography sx={{ ...dialogStyles.primaryText, mb: 2 }}>
            {t('settings.copyContentMessage') ||
              'Deseja copiar o conteúdo da pasta anterior para a nova localização?'}
          </Typography>
          <Typography
            variant="caption"
            sx={{ ...dialogStyles.secondaryText, display: 'block' }}
          >
            {t('settings.copyContentHelper') ||
              'Isto vai copiar todos os arquivos de uma pasta para a outra.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={dialogStyles.dialogActions}>
          <Button
            onClick={() => handleCopyDialogConfirm(false)}
            sx={dialogStyles.cancelButton}
            disabled={loading}
          >
            {t('settings.copyNo') || 'Não Copiar'}
          </Button>
          <Button
            onClick={() => handleCopyDialogConfirm(true)}
            variant="contained"
            sx={dialogStyles.confirmButton}
            disabled={loading}
          >
            {t('settings.copyYes') || 'Copiar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
