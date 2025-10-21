import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Divider,
  Alert,
  IconButton,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FolderIcon from '@mui/icons-material/Folder';
import { useTranslation } from 'react-i18next';
import { dialogStyles } from '../styles/dialogStyles';
import { fileSystemService } from '../services/fileSystemService';

interface WelcomeDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function WelcomeDialog({ open, onClose }: WelcomeDialogProps) {
  const { t } = useTranslation();
  const [defaultPath, setDefaultPath] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [browsing, setBrowsing] = useState<boolean>(false);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const config = await fileSystemService.readConfig();
      if (config && config.defaultPath) {
        setDefaultPath(config.defaultPath);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open]);

  const handleBrowseFolder = async () => {
    try {
      setBrowsing(true);
      const selectedPath = await (window as any).electron.window.selectFolder(
        defaultPath || undefined,
      );
      if (selectedPath) {
        setDefaultPath(selectedPath);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error selecting folder:', error);
    } finally {
      setBrowsing(false);
    }
  };

  const handleConfirm = async () => {
    try {
      // Update config with the chosen path and mark firstRun as false
      const success = await fileSystemService.updateConfig({
        defaultPath: defaultPath.trim(),
        firstRun: false,
      });

      if (success) {
        // Create the directory if it doesn't exist
        await fileSystemService.createDirectory(defaultPath.trim());
        onClose();
      } else {
        // eslint-disable-next-line no-console
        console.error('Failed to update config');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving config:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {}} // Prevent closing by clicking outside
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          ...dialogStyles.dialogPaper,
          minHeight: '500px',
        },
      }}
    >
      <DialogTitle sx={dialogStyles.dialogTitle}>
        {t('welcome.title') || '🔒 Bem-vindo ao LockrNotes'}
      </DialogTitle>

      <DialogContent sx={dialogStyles.dialogContent}>
        {/* Welcome Message */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ ...dialogStyles.headingText, mb: 2 }}>
            {t('welcome.subtitle') || 'Suas Notas Seguras e Criptografadas'}
          </Typography>
          <Typography
            variant="body1"
            sx={{ ...dialogStyles.primaryText, mb: 2, lineHeight: 1.6 }}
          >
            {t('welcome.description') ||
              'LockrNotes é um aplicativo de anotações com foco em segurança e privacidade. Seus arquivos podem ser criptografados de forma automática e segura, mantendo suas informações protegidas.'}
          </Typography>
          <Typography
            variant="body2"
            sx={{ ...dialogStyles.secondaryText, lineHeight: 1.6 }}
          >
            {t('welcome.features') || (
              <>
                <strong>Recursos principais:</strong>
                <br />
                • Criptografia gerenciada automática para seus arquivos
                <br />
                • Suporte para arquivos de texto (.txt) e JSON estruturados
                (.json)
                <br />
                • Interface moderna e intuitiva com tema escuro
                <br />• Organização em pastas e armazenamento local
              </>
            )}
          </Typography>
        </Box>

        <Divider sx={{ my: 3, ...dialogStyles.divider }} />

        {/* Storage Location */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              ...dialogStyles.headingText,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <FolderOpenIcon sx={{ color: 'var(--primary-blue)' }} />
            {t('welcome.storageTitle') || 'Local de Armazenamento'}
          </Typography>
          <Typography
            variant="body2"
            sx={{ ...dialogStyles.secondaryText, mb: 2 }}
          >
            {t('welcome.storageDescription') ||
              'Escolha onde seus arquivos serão armazenados. Por padrão, usamos a pasta "LockrNotes" dentro de seus Documentos. Você pode alterar isso a qualquer momento nas configurações.'}
          </Typography>

          <TextField
            fullWidth
            label={t('welcome.defaultPath') || 'Pasta Padrão'}
            value={loading ? 'Carregando...' : defaultPath}
            onChange={(e) => setDefaultPath(e.target.value)}
            disabled={loading}
            sx={{
              ...dialogStyles.textField,
              '& .MuiInputBase-input': {
                fontFamily: 'monospace',
                fontSize: '0.9rem',
              },
            }}
            helperText={
              t('welcome.pathHelper') ||
              'Caminho completo onde os arquivos serão salvos'
            }
            slotProps={{
              input: {
                endAdornment: (
                  <IconButton
                    onClick={handleBrowseFolder}
                    disabled={loading || browsing}
                    size="small"
                    sx={{ mr: 1 }}
                    title={t('welcome.browseButton') || 'Procurar pasta'}
                  >
                    <FolderIcon sx={{ color: 'var(--primary-blue)' }} />
                  </IconButton>
                ),
              },
            }}
          />
        </Box>

        <Alert
          severity="info"
          sx={{
            ...dialogStyles.warningAlert,
            backgroundColor: 'var(--primary-blue-light)',
            color: 'var(--text-primary)',
            '& .MuiAlert-icon': {
              color: 'var(--primary-blue)',
            },
          }}
        >
          {t('welcome.infoMessage') ||
            'Esta pasta será criada automaticamente se não existir. Você sempre pode mudar esse local nas configurações do aplicativo.'}
        </Alert>
      </DialogContent>

      <DialogActions sx={dialogStyles.dialogActions}>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={loading || !defaultPath.trim()}
          sx={dialogStyles.confirmButton}
        >
          {t('welcome.getStarted') || 'Começar a Usar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
