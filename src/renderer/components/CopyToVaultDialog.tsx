import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { useTranslation } from 'react-i18next';
import { dialogStyles } from '../styles/dialogStyles';
import { SPACING } from '../styles/spacingConstants';
import type { FileSystemItem } from '../types/filesystem';

interface CopyToVaultDialogProps {
  open: boolean;
  onClose: () => void;
  file: FileSystemItem | null;
  onCopyComplete: () => void;
}

/** Coerce a value to string for Vault KV storage. */
function normalizeToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

const JSON_EDITOR_PATTERN_KEY = '_editor_pattern';

function hasJsonExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith('.json') || lower.endsWith('.ljson');
}

function isEncryptedJsonSource(rawContent: string): boolean {
  try {
    const parsed = JSON.parse(rawContent) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const { originalExtension } = parsed as Record<string, unknown>;
      return (
        typeof originalExtension === 'string' &&
        originalExtension.toLowerCase() === '.json'
      );
    }
  } catch {
    // not an encrypted payload json
  }

  return false;
}

function parseEntriesArray(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

function buildJsonVaultPayload(content: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(content) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const parsedObject = parsed as Record<string, unknown>;
      const parsedEntries = parseEntriesArray(parsedObject.entries);

      if (parsedEntries) {
        return {
          [JSON_EDITOR_PATTERN_KEY]: 'json',
          entries: parsedEntries,
        };
      }

      const fallbackEntries = Object.entries(parsedObject)
        .filter(([key]) => key !== JSON_EDITOR_PATTERN_KEY)
        .map(([key, value], index) => ({
          id: `entry_${Date.now()}_${index}`,
          type: 'keyValue',
          title: key,
          value: normalizeToString(value),
        }));

      return {
        [JSON_EDITOR_PATTERN_KEY]: 'json',
        entries: fallbackEntries,
      };
    }
  } catch {
    // fall through to empty json payload
  }

  return {
    [JSON_EDITOR_PATTERN_KEY]: 'json',
    entries: [],
  };
}

export default function CopyToVaultDialog({
  open,
  onClose,
  file,
  onCopyComplete,
}: CopyToVaultDialogProps) {
  const { t } = useTranslation();
  const [vaultPath, setVaultPath] = useState<string>('');
  const [isManagedEncrypted, setIsManagedEncrypted] = useState<boolean>(false);
  const [isManualEncrypted, setIsManualEncrypted] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [detecting, setDetecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !file) {
      setVaultPath('');
      setIsManagedEncrypted(false);
      setIsManualEncrypted(false);
      setPassword('');
      setError(null);
      return;
    }

    // Pre-fill vault path with filename stripped of extension
    const dotIndex = file.name.lastIndexOf('.');
    const nameWithoutExt =
      dotIndex > 0 ? file.name.substring(0, dotIndex) : file.name;
    setVaultPath(nameWithoutExt);

    // Detect encryption type
    const detectEncryption = async () => {
      try {
        const rawContent = await window.electron.filesystem.readFile(file.path);
        if (!rawContent) return;

        const managed =
          await window.encryptionAPI.isContentEncrypted(rawContent);
        if (managed) {
          setIsManagedEncrypted(true);
          setIsManualEncrypted(false);
          return;
        }

        // Check for manual encryption
        try {
          const parsed = JSON.parse(rawContent) as unknown;
          if (
            parsed &&
            typeof parsed === 'object' &&
            !Array.isArray(parsed) &&
            (parsed as Record<string, unknown>).type ===
              'lockrnotes-manual-encrypted'
          ) {
            setIsManualEncrypted(true);
          }
        } catch {
          // Not JSON — plain text file
        }
      } catch {
        // Could not read file; proceed without encryption detection
      } finally {
        setDetecting(false);
      }
    };
    setDetecting(true);
    detectEncryption();
  }, [open, file]);

  const handleConfirm = async () => {
    if (!file) return;
    if (!vaultPath.trim()) {
      setError(t('copyToVaultDialog.errors.emptyPath'));
      return;
    }
    if (isManualEncrypted && !password) {
      setError(t('copyToVaultDialog.errors.passwordRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const targetVaultPath = vaultPath.trim();

      // Prevent accidental overwrite: if the secret already exists, stop here.
      const existingSecret = await window.vaultAPI.getSecret(targetVaultPath);
      if (existingSecret.success) {
        throw new Error(t('copyToVaultDialog.errors.secretAlreadyExists'));
      }
      if (!existingSecret.notFound) {
        const checkExistsError =
          existingSecret.error ||
          t('copyToVaultDialog.errors.checkExistsFailed');
        throw new Error(checkExistsError);
      }

      const rawContent = await window.electron.filesystem.readFile(file.path);
      if (rawContent === null) {
        throw new Error(t('copyToVaultDialog.errors.readFailed'));
      }

      let shouldUseJsonPattern =
        hasJsonExtension(file.name) || isEncryptedJsonSource(rawContent);

      let plainContent: string;

      if (isManagedEncrypted) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(rawContent);
        } catch {
          throw new Error(t('copyToVaultDialog.errors.invalidEncryptedFile'));
        }
        plainContent = await window.encryptionAPI.decryptContent(
          parsed as Parameters<typeof window.encryptionAPI.decryptContent>[0],
          file.path,
        );
      } else if (isManualEncrypted) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(rawContent);
        } catch {
          throw new Error(t('copyToVaultDialog.errors.invalidEncryptedFile'));
        }
        const result = await window.manualEncryptionAPI.decryptContent(
          parsed,
          password,
        );
        if (!result.success || result.data === undefined) {
          throw new Error(
            result.error || t('copyToVaultDialog.errors.decryptionFailed'),
          );
        }
        plainContent = result.data;
      } else {
        plainContent = rawContent;
      }

      let kvData: Record<string, unknown>;

      if (!shouldUseJsonPattern) {
        try {
          const parsed = JSON.parse(plainContent) as unknown;
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const parsedObject = parsed as Record<string, unknown>;
            shouldUseJsonPattern =
              parsedObject[JSON_EDITOR_PATTERN_KEY] === 'json' ||
              parsedObject.entries !== undefined;
          }
        } catch {
          // plain text or non-json content
        }
      }

      if (shouldUseJsonPattern) {
        kvData = buildJsonVaultPayload(plainContent);
      } else {
        // Default Vault pattern: flatten the JSON into simple key-value pairs.
        // Nested objects/arrays are serialized to JSON strings to avoid [object Object].
        try {
          const parsed = JSON.parse(plainContent) as unknown;
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            kvData = {};
            for (const [key, value] of Object.entries(
              parsed as Record<string, unknown>,
            )) {
              kvData[key] = normalizeToString(value);
            }
          } else {
            kvData = { content: plainContent };
          }
        } catch {
          kvData = { content: plainContent };
        }
      }

      const result = await window.vaultAPI.saveSecret(
        targetVaultPath,
        kvData as unknown as Record<string, string>,
      );
      if (!result.success) {
        throw new Error(
          result.error || t('copyToVaultDialog.errors.saveFailed'),
        );
      }

      window.dispatchEvent(
        new CustomEvent('vault:secret-copied', {
          detail: { path: targetVaultPath },
        }),
      );

      onCopyComplete();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('copyToVaultDialog.errors.saveFailed'),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  const isConfirmDisabled =
    loading ||
    detecting ||
    !vaultPath.trim() ||
    (isManualEncrypted && !password);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: dialogStyles.dialogPaper } }}
    >
      <DialogTitle sx={dialogStyles.dialogTitle}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: SPACING.MD }}>
          <VpnKeyIcon fontSize="small" />
          <Typography variant="inherit">
            {t('copyToVaultDialog.title')}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          ...dialogStyles.dialogContent,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.LG,
        }}
      >
        {file && (
          <Typography
            variant="body2"
            sx={{ color: 'var(--text-secondary)', mt: SPACING.SM }}
          >
            {t('copyToVaultDialog.fileLabel')}: <strong>{file.name}</strong>
          </Typography>
        )}

        <TextField
          label={t('copyToVaultDialog.vaultPathLabel')}
          helperText={t('copyToVaultDialog.vaultPathHelper')}
          placeholder={
            t('copyToVaultDialog.vaultPathPlaceholder') ||
            'ex: pasta/subpasta/nome-do-segredo'
          }
          value={vaultPath}
          onChange={(e) => setVaultPath(e.target.value)}
          fullWidth
          size="small"
          disabled={loading}
          sx={dialogStyles.textField}
        />

        {detecting && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: SPACING.MD }}>
            <CircularProgress size={14} />
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
              {t('copyToVaultDialog.detectingEncryption')}
            </Typography>
          </Box>
        )}

        {isManagedEncrypted && (
          <Alert severity="info" sx={{ fontSize: 'var(--font-size-body)' }}>
            {t('copyToVaultDialog.managedEncryptionInfo')}
          </Alert>
        )}

        {isManualEncrypted && (
          <TextField
            label={t('copyToVaultDialog.passwordLabel')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            size="small"
            disabled={loading}
            sx={dialogStyles.textField}
          />
        )}

        {error && (
          <Alert severity="error" sx={{ fontSize: 'var(--font-size-body)' }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={dialogStyles.dialogActions}>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={dialogStyles.cancelButton}
        >
          {t('common.cancel') || 'Cancel'}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isConfirmDisabled}
          variant="contained"
          sx={dialogStyles.confirmButton}
          startIcon={
            loading ? <CircularProgress size={14} color="inherit" /> : undefined
          }
        >
          {loading
            ? t('copyToVaultDialog.copying')
            : t('copyToVaultDialog.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
