import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  InputAdornment,
  SelectChangeEvent,
  Typography,
  CircularProgress,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
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
  WebLoginEntry,
  CustomLoginEntry,
  CustomLoginStep,
} from '../types/jsonEntry';

interface JsonEntryDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (entry: Partial<JsonEntry>) => void;
  editingEntry: JsonEntry | null;
  duplicateData?: JsonEntry | null;
}

const ENTRY_TYPE_OPTIONS: { value: JsonEntryType; fallback: string }[] = [
  { value: 'keyValue', fallback: 'Title + Value' },
  { value: 'titleTwoValues', fallback: 'Title + Value 1 + Value 2' },
  { value: 'titlePassword', fallback: 'Title + Password' },
  { value: 'titleValuePassword', fallback: 'Title + Value + Password' },
  {
    value: 'titleTwoValuesPassword',
    fallback: 'Title + Value 1 + Value 2 + Password',
  },
  { value: 'ssh', fallback: 'SSH' },
  { value: 'rdp', fallback: 'RDP' },
  { value: 'webLogin', fallback: 'Web Login' },
  { value: 'customLogin', fallback: 'Custom login' },
];

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
  const [webUrl, setWebUrl] = useState<string>('');
  const [webUser, setWebUser] = useState<string>('');
  const [webPassword, setWebPassword] = useState<string>('');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [customSteps, setCustomSteps] = useState<CustomLoginStep[]>([]);
  const [recording, setRecording] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Reset or populate fields when dialog opens
  useEffect(() => {
    if (open) {
      setWebUrl('');
      setWebUser('');
      setWebPassword('');
      setCustomUrl('');
      setCustomSteps([]);
      setRecording(false);
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
        } else if (editingEntry.type === 'webLogin') {
          setValue('');
          setValue1('');
          setValue2('');
          setPassword('');
          setWebUrl((editingEntry as WebLoginEntry).url);
          setWebUser((editingEntry as WebLoginEntry).user);
          setWebPassword((editingEntry as WebLoginEntry).password);
        } else if (editingEntry.type === 'customLogin') {
          setValue('');
          setValue1('');
          setValue2('');
          setPassword('');
          setCustomUrl((editingEntry as CustomLoginEntry).url);
          setCustomSteps((editingEntry as CustomLoginEntry).steps || []);
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
        } else if (duplicateData.type === 'webLogin') {
          setValue('');
          setValue1('');
          setValue2('');
          setPassword('');
          setWebUrl((duplicateData as WebLoginEntry).url);
          setWebUser((duplicateData as WebLoginEntry).user);
          setWebPassword((duplicateData as WebLoginEntry).password);
        } else if (duplicateData.type === 'customLogin') {
          setValue('');
          setValue1('');
          setValue2('');
          setPassword('');
          setCustomUrl((duplicateData as CustomLoginEntry).url);
          setCustomSteps((duplicateData as CustomLoginEntry).steps || []);
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
        setWebUrl('');
        setWebUser('');
        setWebPassword('');
        setCustomUrl('');
        setCustomSteps([]);
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

    if (entryType === 'webLogin' || entryType === 'customLogin') {
      const rawUrl = (entryType === 'customLogin' ? customUrl : webUrl).trim();
      if (!rawUrl) {
        setError(t('jsonEditor.errors.emptyUrl') || 'URL is required');
        return;
      }
      const withProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(rawUrl)
        ? rawUrl
        : `https://${rawUrl}`;
      try {
        const parsed = new URL(withProtocol);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          setError(
            t('jsonEditor.errors.invalidUrl') ||
              'Enter a valid http or https URL',
          );
          return;
        }
      } catch {
        setError(
          t('jsonEditor.errors.invalidUrl') ||
            'Enter a valid http or https URL',
        );
        return;
      }
    }

    if (entryType === 'customLogin' && customSteps.length === 0) {
      setError(
        t('jsonEditor.errors.emptyMacro') || 'Record a macro before saving',
      );
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
    } else if (entryType === 'webLogin') {
      const rawUrl = webUrl.trim();
      (entryData as WebLoginEntry).url = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(
        rawUrl,
      )
        ? rawUrl
        : `https://${rawUrl}`;
      (entryData as WebLoginEntry).user = webUser.trim();
      (entryData as WebLoginEntry).password = webPassword.trim();
    } else if (entryType === 'customLogin') {
      const rawUrl = customUrl.trim();
      (entryData as CustomLoginEntry).url = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(
        rawUrl,
      )
        ? rawUrl
        : `https://${rawUrl}`;
      (entryData as CustomLoginEntry).steps = customSteps;
    }

    onConfirm(entryData);
    onClose();
  };

  const handleTypeChange = (event: SelectChangeEvent<JsonEntryType>) => {
    setEntryType(event.target.value as JsonEntryType);
    setError('');
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  let customRecordLabel = t('customLogin.record') || 'Record macro';
  if (recording) {
    customRecordLabel = t('customLogin.recording') || 'Recording…';
  } else if (customSteps.length > 0) {
    customRecordLabel = t('customLogin.rerecord') || 'Record again';
  }

  const handleRecordMacro = async () => {
    const rawUrl = customUrl.trim();
    if (!rawUrl) {
      setError(t('jsonEditor.errors.emptyUrl') || 'URL is required');
      return;
    }
    const { customLoginAPI } = window;
    if (!customLoginAPI) {
      setError(t('customLogin.recordError') || 'Could not start recording');
      return;
    }
    setError('');
    setRecording(true);
    try {
      const result = await customLoginAPI.record({
        url: rawUrl,
        title: title.trim() || 'Login customizado',
      });
      if (result?.success && Array.isArray(result.steps)) {
        setCustomSteps(result.steps);
        if (result.steps.length === 0) {
          setError(t('customLogin.cancelled') || 'Recording cancelled');
        }
      } else if (result?.error) {
        setError(result.error);
      }
    } catch {
      setError(t('customLogin.recordError') || 'Could not start recording');
    } finally {
      setRecording(false);
    }
  };

  const updateCustomTypeStep = (stepId: string, nextValue: string) => {
    setCustomSteps((prev) =>
      prev.map((step) =>
        step.kind === 'type' && step.id === stepId
          ? { ...step, value: nextValue }
          : step,
      ),
    );
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!recording) onClose();
      }}
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
        <FormControl fullWidth sx={{ mt: 2, mb: 1 }}>
          <InputLabel
            id="entry-type-select-label"
            sx={dialogStyles.selectLabel}
          >
            {t('jsonEditor.entryType') || 'Entry Type'}
          </InputLabel>
          <Select
            labelId="entry-type-select-label"
            id="entry-type-select"
            value={entryType}
            label={t('jsonEditor.entryType') || 'Entry Type'}
            onChange={handleTypeChange}
            sx={dialogStyles.select}
            MenuProps={{ PaperProps: { sx: dialogStyles.selectPaper } }}
          >
            {ENTRY_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {t(`jsonEditor.types.${option.value}`) || option.fallback}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          autoFocus
          margin="dense"
          label={
            entryType === 'webLogin' || entryType === 'customLogin'
              ? t('jsonEditor.fields.siteName') || 'Site name'
              : t('jsonEditor.fields.title') || 'Title'
          }
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

        {entryType === 'webLogin' && (
          <>
            <TextField
              margin="dense"
              label={t('jsonEditor.fields.url') || 'URL'}
              fullWidth
              variant="outlined"
              value={webUrl}
              autoComplete="off"
              placeholder="https://example.com/login"
              onChange={(e) => {
                setWebUrl(e.target.value);
                setError('');
              }}
              sx={dialogStyles.textField}
            />
            <TextField
              margin="dense"
              label={t('jsonEditor.fields.login') || 'Login'}
              fullWidth
              variant="outlined"
              value={webUser}
              autoComplete="off"
              onChange={(e) => {
                setWebUser(e.target.value);
                setError('');
              }}
              sx={dialogStyles.textField}
            />
            <TextField
              margin="dense"
              label={t('jsonEditor.fields.password') || 'Password'}
              fullWidth
              variant="outlined"
              type={showPassword ? 'text' : 'password'}
              value={webPassword}
              autoComplete="new-password"
              onChange={(e) => {
                setWebPassword(e.target.value);
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

        {entryType === 'customLogin' && (
          <>
            <TextField
              margin="dense"
              label={t('jsonEditor.fields.url') || 'URL'}
              fullWidth
              variant="outlined"
              value={customUrl}
              autoComplete="off"
              placeholder="https://example.com/login"
              disabled={recording}
              onChange={(e) => {
                setCustomUrl(e.target.value);
                setError('');
              }}
              sx={dialogStyles.textField}
            />
            <Box sx={{ mt: 1.5, mb: 1 }}>
              <Button
                variant="outlined"
                startIcon={
                  recording ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <FiberManualRecordIcon />
                  )
                }
                onClick={handleRecordMacro}
                disabled={recording || !customUrl.trim()}
                sx={dialogStyles.cancelButton}
              >
                {customRecordLabel}
              </Button>
              {recording && (
                <Typography
                  variant="body2"
                  sx={{ color: 'var(--text-secondary)', mt: 1 }}
                >
                  {t('customLogin.recordingHint') ||
                    'Complete the login in the window, then press Stop'}
                </Typography>
              )}
            </Box>
            {customSteps.length > 0 && (
              <Box
                sx={{
                  mt: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                {customSteps.map((step, index) =>
                  step.kind === 'click' ? (
                    <Typography
                      key={step.id}
                      variant="body2"
                      sx={{ color: 'var(--text-secondary)', py: 0.5 }}
                    >
                      {index + 1}. {t('customLogin.click') || 'Click'} “
                      {step.label}”
                    </Typography>
                  ) : (
                    <TextField
                      key={step.id}
                      margin="dense"
                      label={`${index + 1}. ${step.label}`}
                      fullWidth
                      variant="outlined"
                      value={step.value}
                      autoComplete="off"
                      type={
                        step.isPassword && !showPassword ? 'password' : 'text'
                      }
                      onChange={(e) =>
                        updateCustomTypeStep(step.id, e.target.value)
                      }
                      sx={dialogStyles.textField}
                      InputProps={
                        step.isPassword
                          ? {
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    onClick={handleTogglePasswordVisibility}
                                    edge="end"
                                    size="small"
                                    sx={dialogStyles.passwordIcon}
                                  >
                                    {showPassword ? (
                                      <VisibilityOff />
                                    ) : (
                                      <Visibility />
                                    )}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }
                          : undefined
                      }
                    />
                  ),
                )}
              </Box>
            )}
          </>
        )}

        {error && <Box sx={dialogStyles.errorText}>{error}</Box>}
      </DialogContent>
      <DialogActions sx={dialogStyles.dialogActions}>
        <Button
          onClick={onClose}
          disabled={recording}
          sx={dialogStyles.cancelButton}
        >
          {t('dialog.actions.cancel') || 'Cancel'}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={recording}
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
