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
  TitleTwoValuesEntry,
  TitlePasswordEntry,
  TitleValuePasswordEntry,
  TitleTwoValuesPasswordEntry,
  SshEntry,
  RdpEntry,
} from '../types/jsonEntry';

interface JsonEntryDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (entry: Partial<JsonEntry>) => void;
  editingEntry: JsonEntry | null;
  duplicateData?: JsonEntry | null;
}

export default function JsonEntryDialog({
  open,
  onClose,
  onConfirm,
  editingEntry = null,
  duplicateData = null,
}: JsonEntryDialogProps) {
  const { t } = useTranslation();
  const [entryType, setEntryType] = useState<JsonEntryType>('keyValue');
  const [title, setTitle] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [value1, setValue1] = useState<string>('');
  const [value2, setValue2] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [sshHost, setSshHost] = useState<string>('');
  const [sshUser, setSshUser] = useState<string>('');
  const [sshPassword, setSshPassword] = useState<string>('');
  const [port, setPort] = useState<string>('22');
  const [rdpHost, setRdpHost] = useState<string>('');
  const [rdpPort, setRdpPort] = useState<string>('3389');
  const [rdpUser, setRdpUser] = useState<string>('');
  const [rdpPassword, setRdpPassword] = useState<string>('');
  const [rdpDomain, setRdpDomain] = useState<string>('');
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
          setValue1('');
          setValue2('');
          setPassword('');
        } else if (editingEntry.type === 'titleTwoValues') {
          setValue('');
          setValue1((editingEntry as TitleTwoValuesEntry).value1);
          setValue2((editingEntry as TitleTwoValuesEntry).value2);
          setPassword('');
        } else if (editingEntry.type === 'titlePassword') {
          setValue('');
          setValue1('');
          setValue2('');
          setPassword((editingEntry as TitlePasswordEntry).password);
        } else if (editingEntry.type === 'titleValuePassword') {
          setValue((editingEntry as TitleValuePasswordEntry).value);
          setValue1('');
          setValue2('');
          setPassword((editingEntry as TitleValuePasswordEntry).password);
        } else if (editingEntry.type === 'titleTwoValuesPassword') {
          setValue('');
          setValue1((editingEntry as TitleTwoValuesPasswordEntry).value1);
          setValue2((editingEntry as TitleTwoValuesPasswordEntry).value2);
          setPassword((editingEntry as TitleTwoValuesPasswordEntry).password);
        } else if (editingEntry.type === 'ssh') {
          setValue('');
          setValue1('');
          setPort(String((editingEntry as SshEntry).port || 22));
          setValue2('');
          setPassword('');
          setSshHost((editingEntry as SshEntry).host);
          setSshUser((editingEntry as SshEntry).user);
          setSshPassword((editingEntry as SshEntry).password);
        } else if (editingEntry.type === 'rdp') {
          setValue('');
          setValue1('');
          setValue2('');
          setPassword('');
          setRdpHost((editingEntry as RdpEntry).host);
          setRdpPort(String((editingEntry as RdpEntry).port || 3389));
          setRdpUser((editingEntry as RdpEntry).user);
          setRdpPassword((editingEntry as RdpEntry).password);
          setRdpDomain((editingEntry as RdpEntry).domain || '');
        }
      } else if (duplicateData) {
        // Pre-fill from duplicated entry (including title, so user can modify it)
        setEntryType(duplicateData.type);
        setTitle(duplicateData.title);
        if (duplicateData.type === 'keyValue') {
          setValue((duplicateData as KeyValueEntry).value);
          setValue1('');
          setValue2('');
          setPassword('');
        } else if (duplicateData.type === 'titleTwoValues') {
          setValue('');
          setValue1((duplicateData as TitleTwoValuesEntry).value1);
          setValue2((duplicateData as TitleTwoValuesEntry).value2);
          setPassword('');
        } else if (duplicateData.type === 'titlePassword') {
          setValue('');
          setValue1('');
          setValue2('');
          setPassword((duplicateData as TitlePasswordEntry).password);
        } else if (duplicateData.type === 'titleValuePassword') {
          setValue((duplicateData as TitleValuePasswordEntry).value);
          setValue1('');
          setValue2('');
          setPassword((duplicateData as TitleValuePasswordEntry).password);
        } else if (duplicateData.type === 'titleTwoValuesPassword') {
          setValue('');
          setValue1((duplicateData as TitleTwoValuesPasswordEntry).value1);
          setValue2((duplicateData as TitleTwoValuesPasswordEntry).value2);
          setPassword((duplicateData as TitleTwoValuesPasswordEntry).password);
        } else if (duplicateData.type === 'ssh') {
          setValue('');
          setValue1('');
          setPort(String((duplicateData as SshEntry).port || 22));
          setValue2('');
          setPassword('');
          setSshHost((duplicateData as SshEntry).host);
          setSshUser((duplicateData as SshEntry).user);
          setSshPassword((duplicateData as SshEntry).password);
        } else if (duplicateData.type === 'rdp') {
          setValue('');
          setValue1('');
          setValue2('');
          setPassword('');
          setRdpHost((duplicateData as RdpEntry).host);
          setRdpPort(String((duplicateData as RdpEntry).port || 3389));
          setRdpUser((duplicateData as RdpEntry).user);
          setRdpPassword((duplicateData as RdpEntry).password);
          setRdpDomain((duplicateData as RdpEntry).domain || '');
        }
      } else {
        setEntryType('keyValue');
        setTitle('');
        setValue('');
        setValue1('');
        setValue2('');
        setPassword('');
        setSshHost('');
        setSshUser('');
        setSshPassword('');
        setPort('22');
        setRdpHost('');
        setRdpPort('3389');
        setRdpUser('');
        setRdpPassword('');
        setRdpDomain('');
      }
      setError('');
      setShowPassword(false);
    }
  }, [open, editingEntry, duplicateData]);

  const handleConfirm = () => {
    // Validation
    if (!title.trim()) {
      setError(t('jsonEditor.errors.emptyTitle') || 'Title is required');
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
    } else if (entryType === 'titleTwoValues') {
      (entryData as TitleTwoValuesEntry).value1 = value1.trim();
      (entryData as TitleTwoValuesEntry).value2 = value2.trim();
    } else if (entryType === 'titlePassword') {
      (entryData as TitlePasswordEntry).password = password.trim();
    } else if (entryType === 'titleValuePassword') {
      (entryData as TitleValuePasswordEntry).value = value.trim();
      (entryData as TitleValuePasswordEntry).password = password.trim();
    } else if (entryType === 'titleTwoValuesPassword') {
      (entryData as TitleTwoValuesPasswordEntry).value1 = value1.trim();
      (entryData as TitleTwoValuesPasswordEntry).value2 = value2.trim();
      (entryData as TitleTwoValuesPasswordEntry).password = password.trim();
    } else if (entryType === 'ssh') {
      (entryData as SshEntry).host = sshHost.trim();
      (entryData as SshEntry).port = port.trim()
        ? parseInt(port.trim(), 10)
        : 22;
      (entryData as SshEntry).user = sshUser.trim();
      (entryData as SshEntry).password = sshPassword.trim();
    } else if (entryType === 'rdp') {
      (entryData as RdpEntry).host = rdpHost.trim();
      (entryData as RdpEntry).port = rdpPort.trim()
        ? parseInt(rdpPort.trim(), 10)
        : 3389;
      (entryData as RdpEntry).user = rdpUser.trim();
      (entryData as RdpEntry).password = rdpPassword.trim();
      (entryData as RdpEntry).domain = rdpDomain.trim();
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
      <DialogContent
        sx={
          {
            ...dialogStyles.dialogContent,
            ...dialogStyles.scrollbar,
          } as any
        }
      >
        <FormControl component="fieldset" sx={{ mt: 2, mb: 2, width: '100%' }}>
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
              value="titleTwoValues"
              control={<Radio sx={dialogStyles.checkboxRadio} />}
              label={
                t('jsonEditor.types.titleTwoValues') ||
                'Title + Value 1 + Value 2'
              }
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
            <FormControlLabel
              value="titleTwoValuesPassword"
              control={<Radio sx={dialogStyles.checkboxRadio} />}
              label={
                t('jsonEditor.types.titleTwoValuesPassword') ||
                'Title + Value 1 + Value 2 + Password'
              }
            />
            <FormControlLabel
              value="ssh"
              control={<Radio sx={dialogStyles.checkboxRadio} />}
              label={t('jsonEditor.types.ssh') || 'SSH'}
            />
            <FormControlLabel
              value="rdp"
              control={<Radio sx={dialogStyles.checkboxRadio} />}
              label={t('jsonEditor.types.rdp') || 'RDP'}
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
          autoComplete="off"
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
            autoComplete="off"
            onChange={(e) => {
              setValue(e.target.value);
              setError('');
            }}
            sx={dialogStyles.textField}
          />
        )}

        {(entryType === 'titleTwoValues' ||
          entryType === 'titleTwoValuesPassword') && (
          <>
            <TextField
              margin="dense"
              label={t('jsonEditor.fields.value1') || 'Value 1'}
              fullWidth
              variant="outlined"
              value={value1}
              autoComplete="off"
              onChange={(e) => {
                setValue1(e.target.value);
                setError('');
              }}
              sx={dialogStyles.textField}
            />
            <TextField
              margin="dense"
              label={t('jsonEditor.fields.value2') || 'Value 2'}
              fullWidth
              variant="outlined"
              value={value2}
              autoComplete="off"
              onChange={(e) => {
                setValue2(e.target.value);
                setError('');
              }}
              sx={dialogStyles.textField}
            />
          </>
        )}

        {entryType === 'ssh' && (
          <>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                margin="dense"
                label={t('jsonEditor.fields.host') || 'Host'}
                variant="outlined"
                value={sshHost}
                autoComplete="off"
                onChange={(e) => {
                  setSshHost(e.target.value);
                  setError('');
                }}
                sx={{ ...dialogStyles.textField, flex: 1 }}
              />
              <TextField
                margin="dense"
                label={t('jsonEditor.fields.port') || 'Port'}
                variant="outlined"
                value={port}
                autoComplete="off"
                onChange={(e) => {
                  setPort(e.target.value);
                  setError('');
                }}
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  autoComplete: 'off',
                }}
                sx={{ ...dialogStyles.textField, width: '100px' }}
              />
            </Box>
            <TextField
              margin="dense"
              label={t('jsonEditor.fields.user') || 'User'}
              fullWidth
              variant="outlined"
              value={sshUser}
              autoComplete="off"
              onChange={(e) => {
                setSshUser(e.target.value);
                setError('');
              }}
              sx={dialogStyles.textField}
            />
          </>
        )}

        {(entryType === 'titlePassword' ||
          entryType === 'titleValuePassword' ||
          entryType === 'titleTwoValuesPassword' ||
          entryType === 'ssh') && (
          <TextField
            margin="dense"
            label={t('jsonEditor.fields.password') || 'Password'}
            fullWidth
            variant="outlined"
            type={showPassword ? 'text' : 'password'}
            value={entryType === 'ssh' ? sshPassword : password}
            autoComplete="new-password"
            onChange={(e) => {
              if (entryType === 'ssh') {
                setSshPassword(e.target.value);
              } else {
                setPassword(e.target.value);
              }
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

        {entryType === 'rdp' && (
          <>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                margin="dense"
                label={t('jsonEditor.fields.host') || 'Host'}
                variant="outlined"
                value={rdpHost}
                autoComplete="off"
                onChange={(e) => {
                  setRdpHost(e.target.value);
                  setError('');
                }}
                sx={{ ...dialogStyles.textField, flex: 1 }}
              />
              <TextField
                margin="dense"
                label={t('jsonEditor.fields.port') || 'Port'}
                variant="outlined"
                value={rdpPort}
                autoComplete="off"
                onChange={(e) => {
                  setRdpPort(e.target.value);
                  setError('');
                }}
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  autoComplete: 'off',
                }}
                sx={{ ...dialogStyles.textField, width: '100px' }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                margin="dense"
                label={t('jsonEditor.fields.domain') || 'Domain'}
                variant="outlined"
                value={rdpDomain}
                autoComplete="off"
                onChange={(e) => {
                  setRdpDomain(e.target.value);
                  setError('');
                }}
                sx={{ ...dialogStyles.textField, flex: 1 }}
              />
              <TextField
                margin="dense"
                label={t('jsonEditor.fields.user') || 'User'}
                variant="outlined"
                value={rdpUser}
                autoComplete="off"
                onChange={(e) => {
                  setRdpUser(e.target.value);
                  setError('');
                }}
                sx={{ ...dialogStyles.textField, flex: 1 }}
              />
            </Box>
            <TextField
              margin="dense"
              label={t('jsonEditor.fields.password') || 'Password'}
              fullWidth
              variant="outlined"
              type={showPassword ? 'text' : 'password'}
              value={rdpPassword}
              autoComplete="new-password"
              onChange={(e) => {
                setRdpPassword(e.target.value);
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
          </>
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

JsonEntryDialog.defaultProps = {
  duplicateData: null,
};
