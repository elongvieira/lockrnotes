import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  IconButton,
  InputAdornment,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next';
import { dialogStyles } from '../styles/dialogStyles';
import {
  JsonEntry,
  JsonEntryType,
  KeyValueEntry,
  TitlePasswordEntry,
  TitleValuePasswordEntry,
} from '../types/jsonEntry';

interface JsonEntryDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (entry: Partial<JsonEntry>) => void;
  editingEntry: JsonEntry | null;
}

export default function JsonEntryDialog({
  open,
  onClose,
  onConfirm,
  editingEntry = null,
}: JsonEntryDialogProps) {
  const { t } = useTranslation();
  const [entryType, setEntryType] = useState<JsonEntryType>('keyValue');
  const [title, setTitle] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Reset or populate fields when dialog opens
  useEffect(() => {
    if (open) {
      if (editingEntry) {
        setEntryType(editingEntry.type);
        setTitle(editingEntry.title);
        if (editingEntry.type === 'keyValue') {
          setValue((editingEntry as KeyValueEntry).value);
          setPassword('');
        } else if (editingEntry.type === 'titlePassword') {
          setValue('');
          setPassword((editingEntry as TitlePasswordEntry).password);
        } else if (editingEntry.type === 'titleValuePassword') {
          setValue((editingEntry as TitleValuePasswordEntry).value);
          setPassword((editingEntry as TitleValuePasswordEntry).password);
        }
      } else {
        setEntryType('keyValue');
        setTitle('');
        setValue('');
        setPassword('');
      }
      setError('');
      setShowPassword(false);
    }
  }, [open, editingEntry]);

  const handleConfirm = () => {
    // Validation
    if (!title.trim()) {
      setError(t('jsonEditor.errors.emptyTitle') || 'Title is required');
      return;
    }

    if (entryType === 'keyValue' && !value.trim()) {
      setError(t('jsonEditor.errors.emptyValue') || 'Value is required');
      return;
    }

    if (
      (entryType === 'titlePassword' || entryType === 'titleValuePassword') &&
      !password.trim()
    ) {
      setError(t('jsonEditor.errors.emptyPassword') || 'Password is required');
      return;
    }

    if (entryType === 'titleValuePassword' && !value.trim()) {
      setError(t('jsonEditor.errors.emptyValue') || 'Value is required');
      return;
    }

    // Build entry data
    const entryData: Partial<JsonEntry> = {
      type: entryType,
      title: title.trim(),
      ...(editingEntry && { id: editingEntry.id }),
    };

    if (entryType === 'keyValue') {
      (entryData as KeyValueEntry).value = value.trim();
    } else if (entryType === 'titlePassword') {
      (entryData as TitlePasswordEntry).password = password.trim();
    } else if (entryType === 'titleValuePassword') {
      (entryData as TitleValuePasswordEntry).value = value.trim();
      (entryData as TitleValuePasswordEntry).password = password.trim();
    }

    onConfirm(entryData);
    onClose();
  };

  const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEntryType(event.target.value as JsonEntryType);
    setError('');
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

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
        {editingEntry
          ? t('jsonEditor.editEntry') || 'Edit Entry'
          : t('jsonEditor.addEntry') || 'Add Entry'}
      </DialogTitle>
      <DialogContent sx={dialogStyles.dialogContent}>
        <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
          <FormLabel component="legend" sx={{ mb: 1 }}>
            {t('jsonEditor.entryType') || 'Entry Type'}
          </FormLabel>
          <RadioGroup value={entryType} onChange={handleTypeChange}>
            <FormControlLabel
              value="keyValue"
              control={<Radio sx={dialogStyles.checkboxRadio} />}
              label={t('jsonEditor.types.keyValue') || 'Title + Value'}
            />
            <FormControlLabel
              value="titlePassword"
              control={<Radio sx={dialogStyles.checkboxRadio} />}
              label={t('jsonEditor.types.titlePassword') || 'Title + Password'}
            />
            <FormControlLabel
              value="titleValuePassword"
              control={<Radio sx={dialogStyles.checkboxRadio} />}
              label={
                t('jsonEditor.types.titleValuePassword') ||
                'Title + Value + Password'
              }
            />
          </RadioGroup>
        </FormControl>

        <TextField
          autoFocus
          margin="dense"
          label={t('jsonEditor.fields.title') || 'Title'}
          fullWidth
          variant="outlined"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError('');
          }}
          sx={dialogStyles.textField}
        />

        {(entryType === 'keyValue' || entryType === 'titleValuePassword') && (
          <TextField
            margin="dense"
            label={t('jsonEditor.fields.value') || 'Value'}
            fullWidth
            variant="outlined"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError('');
            }}
            sx={dialogStyles.textField}
          />
        )}

        {(entryType === 'titlePassword' ||
          entryType === 'titleValuePassword') && (
          <TextField
            margin="dense"
            label={t('jsonEditor.fields.password') || 'Password'}
            fullWidth
            variant="outlined"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            sx={dialogStyles.textField}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                    size="small"
                    sx={dialogStyles.passwordIcon}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}

        {error && (
          <Box sx={{ color: '#ff6b6b', fontSize: '0.875rem', mt: 1 }}>
            {error}
          </Box>
        )}
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
          {editingEntry
            ? t('dialog.actions.save') || 'Save'
            : t('dialog.actions.add') || 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
