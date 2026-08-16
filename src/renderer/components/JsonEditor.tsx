import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CopyAllIcon from '@mui/icons-material/CopyAll';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import TerminalIcon from '@mui/icons-material/Terminal';
import LanguageIcon from '@mui/icons-material/Language';
import CodeIcon from '@mui/icons-material/Code';
import TableChartIcon from '@mui/icons-material/TableChart';
import { useTranslation } from 'react-i18next';
import { fileSystemService } from '../services/fileSystemService';
import { joinPath } from '../utils/pathUtil';
import { useAppContext } from '../contexts/AppContext';
import {
  JsonEntry,
  KeyValueEntry,
  TitleTwoValuesEntry,
  TitlePasswordEntry,
  TitleValuePasswordEntry,
  TitleTwoValuesPasswordEntry,
  SshEntry,
  RdpEntry,
  WebLoginEntry,
  parseJsonContent,
  serializeJsonContent,
  createEntry,
} from '../types/jsonEntry';
import JsonEntryDialog from './JsonEntryDialog';
import ConfirmDialog from './ConfirmDialog';
import HotCopyDialog from './HotCopyDialog';
import { dialogStyles } from '../styles/dialogStyles';
import './JsonEditor.css';

interface JsonEditorProps {
  content: string;
  onContentChange: (newContent: string) => void;
  filePath?: string;
}

export default function JsonEditor({
  content,
  onContentChange,
  filePath: currentFilePath = '',
}: JsonEditorProps) {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<JsonEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<JsonEntry | null>(null);
  const [duplicateData, setDuplicateData] = useState<JsonEntry | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [entryToDelete, setEntryToDelete] = useState<JsonEntry | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(
    new Set(),
  );
  const [visibleValues, setVisibleValues] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<Record<string, number | null>>({});
  const [showAll, setShowAll] = useState<boolean>(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);
  const [editMode, setEditMode] = useState<'structured' | 'raw'>('structured');
  const [rawJsonText, setRawJsonText] = useState<string>('');
  const { refreshSidebar, showNotification } = useAppContext();

  // HotCopy state
  const [hotCopyDialogOpen, setHotCopyDialogOpen] = useState<boolean>(false);
  const [hotCopyData, setHotCopyData] = useState<{
    entryIndex: number;
    fieldName: string;
    value: string;
  } | null>(null);
  const [hotCopyOccupied, setHotCopyOccupied] = useState<number[]>([]);

  // Função para mascarar um valor.
  // - visible: se true, mostra o valor completo
  // - fullHide: se true e visible=false, esconde todo o conteúdo (mostra apenas bullets)
  const maskValue = (
    value: string,
    visible: boolean,
    fullHide = false,
  ): string => {
    if (visible || value.length === 0) return value;
    if (fullHide) {
      // return bullets of same length to avoid leaking length? Use fixed bullets to avoid length leak
      return '••••••••';
    }
    if (value.length <= 4) return '••••••';
    const visiblePart = value.slice(-4);
    const maskedPart = '••••••';
    return maskedPart + visiblePart;
  };

  // Função para filtrar entradas baseado na pesquisa
  const filteredEntries = entries.filter((entry) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();

    if ('title' in entry && entry.title.toLowerCase().includes(query)) {
      return true;
    }

    if (entry.type === 'webLogin' && entry.url.toLowerCase().includes(query)) {
      return true;
    }

    return false;
  });

  // Parse content on mount or when content changes externally
  useEffect(() => {
    const parsed = parseJsonContent(content);
    setEntries(parsed);
  }, [content]);

  const handleAddEntry = () => {
    setEditingEntry(null);
    setDialogOpen(true);
  };

  const handleEditEntry = (entry: JsonEntry) => {
    setEditingEntry(entry);
    setDialogOpen(true);
  };

  const handleDeleteEntry = (entry: JsonEntry) => {
    setEntryToDelete(entry);
    setDeleteConfirmOpen(true);
  };

  const handleDuplicateEntry = (entry: JsonEntry) => {
    // Open dialog with pre-filled data from duplicated entry, but don't set editingEntry
    // This ensures a NEW entry is created instead of modifying the original
    setEditingEntry(null);
    setDialogOpen(true);
    // Store the duplicate data in a temporary state to pass to dialog
    setDuplicateData(entry);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingEntry(null);
    setDuplicateData(null);
  };

  const handleDialogConfirm = (entryData: Partial<JsonEntry>) => {
    let updatedEntries: JsonEntry[];

    if (editingEntry) {
      // Update existing entry
      updatedEntries = entries.map((e) =>
        e.id === editingEntry.id ? ({ ...e, ...entryData } as JsonEntry) : e,
      );
    } else {
      // Add new entry
      const newEntry = createEntry(entryData.type!, entryData);
      updatedEntries = [...entries, newEntry];
    }

    setEntries(updatedEntries);
    onContentChange(serializeJsonContent(updatedEntries));
  };

  const handleDeleteConfirm = () => {
    if (!entryToDelete) return;

    const updatedEntries = entries.filter((e) => e.id !== entryToDelete.id);
    setEntries(updatedEntries);
    onContentChange(serializeJsonContent(updatedEntries));
    setDeleteConfirmOpen(false);
    setEntryToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setEntryToDelete(null);
  };

  const moveEntry = (index: number, direction: 'up' | 'down') => {
    const newEntries = [...entries];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newEntries.length) return;
    const [moved] = newEntries.splice(index, 1);
    newEntries.splice(targetIndex, 0, moved);
    setEntries(newEntries);
    onContentChange(serializeJsonContent(newEntries));
  };

  const togglePasswordVisibility = (entryId: string) => {
    setVisiblePasswords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const toggleValueVisibility = (entryId: string, fieldIndex: number) => {
    const key = `${entryId}-${fieldIndex}`;
    setVisibleValues((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const toggleShowAll = () => {
    if (showAll) {
      // Hide all
      setVisiblePasswords(new Set());
      setVisibleValues(new Set());
      setShowAll(false);
    } else {
      // Show all
      const allPasswordIds = new Set(entries.map((e) => e.id));
      const allValueIds = new Set<string>();

      entries.forEach((entry) => {
        if (entry.type === 'keyValue') {
          allValueIds.add(`${entry.id}-0`);
        } else if (entry.type === 'titleTwoValues') {
          allValueIds.add(`${entry.id}-0`);
          allValueIds.add(`${entry.id}-1`);
        } else if (entry.type === 'titleValuePassword') {
          allValueIds.add(`${entry.id}-0`);
        } else if (entry.type === 'titleTwoValuesPassword') {
          allValueIds.add(`${entry.id}-0`);
          allValueIds.add(`${entry.id}-1`);
        } else if (
          entry.type === 'ssh' ||
          entry.type === 'rdp' ||
          entry.type === 'webLogin'
        ) {
          allValueIds.add(`${entry.id}-0`);
          allValueIds.add(`${entry.id}-1`);
        }
      });

      setVisiblePasswords(allPasswordIds);
      setVisibleValues(allValueIds);
      setShowAll(true);
    }
  };

  const handleCopy = async (entryId: string, text: string, idx = 0) => {
    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied((prev) => ({ ...prev, [entryId]: idx }));
      setTimeout(() => {
        setCopied((prev) => ({ ...prev, [entryId]: null }));
      }, 1800);
    } catch {
      // intentionally silent; could notify
    }
  };

  const handleAddToHotCopy = async (
    entryIndex: number,
    fieldName: string,
    value: string,
  ) => {
    if (!currentFilePath) {
      showNotification(
        t('hotcopy.noFileError') || 'Cannot add: file not saved',
        'error',
      );
      return;
    }
    setHotCopyData({ entryIndex, fieldName, value });
    // Load occupied positions and check for duplicates before opening dialog
    try {
      const items = await window.hotCopyAPI?.getItems();
      const safeItems = items || [];
      const duplicate = safeItems.some(
        (item: any) =>
          item.filePath === currentFilePath &&
          item.entryIndex === entryIndex &&
          item.fieldName === fieldName,
      );
      if (duplicate) {
        showNotification(
          t('hotcopy.alreadyAdded') ||
            'This field is already in a quick copy slot',
          'warning',
        );
        return;
      }
      setHotCopyOccupied(safeItems.map((item: any) => item.position));
      setHotCopyDialogOpen(true);
    } catch {
      showNotification(
        t('hotcopy.loadError') || 'Failed to load quick copy slots',
        'error',
      );
    }
  };

  const handleHotCopyConfirm = async (position: number, label?: string) => {
    if (!hotCopyData) return;

    try {
      const result = await window.hotCopyAPI?.addItem(
        currentFilePath,
        hotCopyData.entryIndex,
        hotCopyData.fieldName,
        position,
        label,
      );

      if (result?.success) {
        showNotification(
          t('hotcopy.added') || 'Added to quick copy!',
          'success',
        );
        // Notify HotCopyBar to reload
        window.dispatchEvent(new Event('hotcopy-updated'));
      } else {
        showNotification(
          t('hotcopy.addError') || 'Failed to add to quick copy',
          'error',
        );
      }
    } catch {
      showNotification(
        t('hotcopy.addError') || 'Failed to add to quick copy',
        'error',
      );
    }

    setHotCopyDialogOpen(false);
    setHotCopyData(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleCreateNewFromCurrent = async () => {
    handleMenuClose();

    try {
      // Get default notes directory to use as initial folder for picker
      const defaultNotesDir =
        await fileSystemService.getDefaultNotesDirectory();

      const selectedPath = await (window as any).electron.window.selectFolder(
        defaultNotesDir,
      );

      if (!selectedPath) return; // user cancelled

      const jsonContent = serializeJsonContent(entries);
      const filename = `copy-${Date.now()}.json`;
      const filePath = await joinPath(selectedPath, filename);

      const success = await fileSystemService.createFile(filePath, jsonContent);
      if (success && refreshSidebar) refreshSidebar();

      if (showNotification) {
        const msg = success
          ? t('notifications.fileCreated') || 'File created successfully'
          : t('notifications.fileCreationError') || 'Error creating file';
        const severity: 'success' | 'error' = success ? 'success' : 'error';
        showNotification(msg, severity);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error creating file from current entries:', err);
      if (showNotification)
        showNotification(
          t('notifications.fileCreationError') || 'Error creating file',
          'error',
        );
    }
  };

  const toggleEditMode = () => {
    if (editMode === 'structured') {
      // Switch to raw mode: serialize current entries to JSON text
      const jsonText = serializeJsonContent(entries);
      setRawJsonText(jsonText);
      setEditMode('raw');
    } else {
      // Switch to structured mode: parse raw JSON text
      try {
        const parsed = parseJsonContent(rawJsonText);
        setEntries(parsed);
        onContentChange(rawJsonText);
        setEditMode('structured');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error parsing JSON:', error);
        if (showNotification) {
          showNotification(
            t('jsonEditor.parseError') || 'Invalid JSON format',
            'error',
          );
        }
      }
    }
  };

  const renderEntryValue = (entry: JsonEntry, entryIndex: number) => {
    switch (entry.type) {
      case 'keyValue': {
        const kvEntry = entry as KeyValueEntry;
        const kvVisible = visibleValues.has(`${entry.id}-0`);
        return (
          <Box sx={dialogStyles.flexCenterGap}>
            <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
              {maskValue(kvEntry.value, kvVisible)}
            </Typography>
            <IconButton
              size="small"
              onClick={() => toggleValueVisibility(entry.id, 0)}
              sx={{
                color: 'var(--text-secondary)',
                '&:hover': { color: 'var(--primary-blue)' },
              }}
            >
              {kvVisible ? (
                <VisibilityOffIcon fontSize="small" />
              ) : (
                <VisibilityIcon fontSize="small" />
              )}
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleCopy(entry.id, kvEntry.value)}
              className="json-editor-copy-btn"
            >
              {copied[entry.id] === 0 ? (
                <CheckIcon fontSize="small" />
              ) : (
                <ContentCopyIcon fontSize="small" />
              )}
            </IconButton>
            <IconButton
              size="small"
              onClick={() =>
                handleAddToHotCopy(entryIndex, 'value', kvEntry.value)
              }
              sx={{
                color: 'var(--text-secondary)',
                '&:hover': { color: 'var(--primary-blue)' },
              }}
              title={t('hotcopy.addToHotCopy') || 'Add to quick copy'}
            >
              <BookmarkAddIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      }
      case 'titleTwoValues': {
        const ttEntry = entry as TitleTwoValuesEntry;
        const ttValue1Visible = visibleValues.has(`${entry.id}-0`);
        const ttValue2Visible = visibleValues.has(`${entry.id}-1`);
        return (
          <Box>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                {t('jsonEditor.fields.value1')}:{' '}
                {maskValue(ttEntry.value1, ttValue1Visible)}
              </Typography>
              <IconButton
                size="small"
                onClick={() => toggleValueVisibility(entry.id, 0)}
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
              >
                {ttValue1Visible ? (
                  <VisibilityOffIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleCopy(entry.id, ttEntry.value1, 0)}
                className="json-editor-copy-btn"
              >
                {copied[entry.id] === 0 ? (
                  <CheckIcon fontSize="small" />
                ) : (
                  <ContentCopyIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() =>
                  handleAddToHotCopy(entryIndex, 'value1', ttEntry.value1)
                }
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
                title={t('hotcopy.addToHotCopy') || 'Add to quick copy'}
              >
                <BookmarkAddIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                {t('jsonEditor.fields.value2')}:{' '}
                {maskValue(ttEntry.value2, ttValue2Visible)}
              </Typography>
              <IconButton
                size="small"
                onClick={() => toggleValueVisibility(entry.id, 1)}
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
              >
                {ttValue2Visible ? (
                  <VisibilityOffIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleCopy(entry.id, ttEntry.value2, 1)}
                className="json-editor-copy-btn"
              >
                {copied[entry.id] === 1 ? (
                  <CheckIcon fontSize="small" />
                ) : (
                  <ContentCopyIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() =>
                  handleAddToHotCopy(entryIndex, 'value2', ttEntry.value2)
                }
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
                title={t('hotcopy.addToHotCopy') || 'Add to quick copy'}
              >
                <BookmarkAddIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        );
      }
      case 'titlePassword': {
        const tpEntry = entry as TitlePasswordEntry;
        const tpVisible = visiblePasswords.has(entry.id);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
              {t('jsonEditor.fields.password')}:{' '}
              {maskValue(tpEntry.password, tpVisible, true)}
            </Typography>
            <IconButton
              size="small"
              onClick={() => togglePasswordVisibility(entry.id)}
              sx={{
                color: 'var(--text-secondary)',
                '&:hover': { color: 'var(--primary-blue)' },
              }}
            >
              {tpVisible ? (
                <VisibilityOffIcon fontSize="small" />
              ) : (
                <VisibilityIcon fontSize="small" />
              )}
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleCopy(entry.id, tpEntry.password, 0)}
              className="json-editor-copy-btn"
            >
              {copied[entry.id] === 0 ? (
                <CheckIcon fontSize="small" />
              ) : (
                <ContentCopyIcon fontSize="small" />
              )}
            </IconButton>
            <IconButton
              size="small"
              onClick={() =>
                handleAddToHotCopy(entryIndex, 'password', tpEntry.password)
              }
              sx={{
                color: 'var(--text-secondary)',
                '&:hover': { color: 'var(--primary-blue)' },
              }}
              title={t('hotcopy.addToHotCopy') || 'Add to quick copy'}
            >
              <BookmarkAddIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      }
      case 'titleValuePassword': {
        const tvpEntry = entry as TitleValuePasswordEntry;
        const tvpPasswordVisible = visiblePasswords.has(entry.id);
        const tvpValueVisible = visibleValues.has(`${entry.id}-0`);
        return (
          <Box>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                {maskValue(tvpEntry.value, tvpValueVisible)}
              </Typography>
              <IconButton
                size="small"
                onClick={() => toggleValueVisibility(entry.id, 0)}
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
              >
                {tvpValueVisible ? (
                  <VisibilityOffIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleCopy(entry.id, tvpEntry.value, 0)}
                className="json-editor-copy-btn"
              >
                {copied[entry.id] === 0 ? (
                  <CheckIcon fontSize="small" />
                ) : (
                  <ContentCopyIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() =>
                  handleAddToHotCopy(entryIndex, 'value', tvpEntry.value)
                }
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
                title={t('hotcopy.addToHotCopy') || 'Add to quick copy'}
              >
                <BookmarkAddIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{ color: 'var(--text-secondary)' }}
              >
                {t('jsonEditor.fields.password')}:{' '}
                {maskValue(tvpEntry.password, tvpPasswordVisible, true)}
              </Typography>
              <IconButton
                size="small"
                onClick={() => togglePasswordVisibility(entry.id)}
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
              >
                {tvpPasswordVisible ? (
                  <VisibilityOffIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleCopy(entry.id, tvpEntry.password, 1)}
                className="json-editor-copy-btn"
              >
                {copied[entry.id] === 1 ? (
                  <CheckIcon fontSize="small" />
                ) : (
                  <ContentCopyIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() =>
                  handleAddToHotCopy(entryIndex, 'password', tvpEntry.password)
                }
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
                title={t('hotcopy.addToHotCopy') || 'Add to quick copy'}
              >
                <BookmarkAddIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        );
      }
      case 'titleTwoValuesPassword': {
        const ttpEntry = entry as TitleTwoValuesPasswordEntry;
        const ttpPasswordVisible = visiblePasswords.has(entry.id);
        const ttpValue1Visible = visibleValues.has(`${entry.id}-0`);
        const ttpValue2Visible = visibleValues.has(`${entry.id}-1`);
        return (
          <Box>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                {maskValue(ttpEntry.value1, ttpValue1Visible)}
              </Typography>
              <IconButton
                size="small"
                onClick={() => toggleValueVisibility(entry.id, 0)}
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
              >
                {ttpValue1Visible ? (
                  <VisibilityOffIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleCopy(entry.id, ttpEntry.value1, 0)}
                className="json-editor-copy-btn"
              >
                {copied[entry.id] === 0 ? (
                  <CheckIcon fontSize="small" />
                ) : (
                  <ContentCopyIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() =>
                  handleAddToHotCopy(entryIndex, 'value1', ttpEntry.value1)
                }
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
                title={t('hotcopy.addToHotCopy') || 'Add to quick copy'}
              >
                <BookmarkAddIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                {maskValue(ttpEntry.value2, ttpValue2Visible)}
              </Typography>
              <IconButton
                size="small"
                onClick={() => toggleValueVisibility(entry.id, 1)}
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
              >
                {ttpValue2Visible ? (
                  <VisibilityOffIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleCopy(entry.id, ttpEntry.value2, 1)}
                className="json-editor-copy-btn"
              >
                {copied[entry.id] === 1 ? (
                  <CheckIcon fontSize="small" />
                ) : (
                  <ContentCopyIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() =>
                  handleAddToHotCopy(entryIndex, 'value2', ttpEntry.value2)
                }
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
                title={t('hotcopy.addToHotCopy') || 'Add to quick copy'}
              >
                <BookmarkAddIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{ color: 'var(--text-secondary)' }}
              >
                {t('jsonEditor.fields.password')}:{' '}
                {maskValue(ttpEntry.password, ttpPasswordVisible, true)}
              </Typography>
              <IconButton
                size="small"
                onClick={() => togglePasswordVisibility(entry.id)}
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
              >
                {ttpPasswordVisible ? (
                  <VisibilityOffIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleCopy(entry.id, ttpEntry.password, 2)}
                className="json-editor-copy-btn"
              >
                {copied[entry.id] === 2 ? (
                  <CheckIcon fontSize="small" />
                ) : (
                  <ContentCopyIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() =>
                  handleAddToHotCopy(entryIndex, 'password', ttpEntry.password)
                }
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
                title={t('hotcopy.addToHotCopy') || 'Add to quick copy'}
              >
                <BookmarkAddIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        );
      }
      case 'ssh': {
        const sshEntry = entry as SshEntry;
        const sshPasswordVisible = visiblePasswords.has(entry.id);
        const sshHostVisible = visibleValues.has(`${entry.id}-0`);
        const sshUserVisible = visibleValues.has(`${entry.id}-1`);
        return (
          <Box>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                {t('jsonEditor.fields.host')}:{' '}
                {maskValue(sshEntry.host, sshHostVisible)}
              </Typography>
              <IconButton
                size="small"
                onClick={() => toggleValueVisibility(entry.id, 0)}
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
              >
                {sshHostVisible ? (
                  <VisibilityOffIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleCopy(entry.id, sshEntry.host, 0)}
                className="json-editor-copy-btn"
              >
                {copied[entry.id] === 0 ? (
                  <CheckIcon fontSize="small" />
                ) : (
                  <ContentCopyIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() =>
                  handleAddToHotCopy(entryIndex, 'host', sshEntry.host)
                }
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
                title={t('hotcopy.addToHotCopy') || 'Add to quick copy'}
              >
                <BookmarkAddIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                {t('jsonEditor.fields.user')}:{' '}
                {maskValue(sshEntry.user, sshUserVisible)}
              </Typography>
              <IconButton
                size="small"
                onClick={() => toggleValueVisibility(entry.id, 1)}
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
              >
                {sshUserVisible ? (
                  <VisibilityOffIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleCopy(entry.id, sshEntry.user, 1)}
                className="json-editor-copy-btn"
              >
                {copied[entry.id] === 1 ? (
                  <CheckIcon fontSize="small" />
                ) : (
                  <ContentCopyIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() =>
                  handleAddToHotCopy(entryIndex, 'user', sshEntry.user)
                }
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
                title={t('hotcopy.addToHotCopy') || 'Add to quick copy'}
              >
                <BookmarkAddIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{ color: 'var(--text-secondary)' }}
              >
                {t('jsonEditor.fields.password')}:{' '}
                {maskValue(sshEntry.password, sshPasswordVisible, true)}
              </Typography>
              <IconButton
                size="small"
                onClick={() => togglePasswordVisibility(entry.id)}
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
              >
                {sshPasswordVisible ? (
                  <VisibilityOffIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleCopy(entry.id, sshEntry.password, 2)}
                className="json-editor-copy-btn"
              >
                {copied[entry.id] === 2 ? (
                  <CheckIcon fontSize="small" />
                ) : (
                  <ContentCopyIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() =>
                  handleAddToHotCopy(entryIndex, 'password', sshEntry.password)
                }
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
                title={t('hotcopy.addToHotCopy') || 'Add to quick copy'}
              >
                <BookmarkAddIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        );
      }
      case 'rdp': {
        const rdpEntry = entry as RdpEntry;
        const rdpPasswordVisible = visiblePasswords.has(entry.id);
        const rdpHostVisible = visibleValues.has(`${entry.id}-0`);
        const rdpUserVisible = visibleValues.has(`${entry.id}-1`);
        return (
          <Box>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                {t('jsonEditor.fields.host')}:{' '}
                {maskValue(rdpEntry.host, rdpHostVisible)}
              </Typography>
              <IconButton
                size="small"
                onClick={() => toggleValueVisibility(entry.id, 0)}
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
              >
                {rdpHostVisible ? (
                  <VisibilityOffIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleCopy(entry.id, rdpEntry.host, 0)}
                className="json-editor-copy-btn"
              >
                {copied[entry.id] === 0 ? (
                  <CheckIcon fontSize="small" />
                ) : (
                  <ContentCopyIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() =>
                  handleAddToHotCopy(entryIndex, 'host', rdpEntry.host)
                }
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
                title={t('hotcopy.addToHotCopy') || 'Add to quick copy'}
              >
                <BookmarkAddIcon fontSize="small" />
              </IconButton>
            </Box>
            {rdpEntry.domain && (
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: 'var(--text-primary)' }}
                >
                  {t('jsonEditor.fields.domain')}: {rdpEntry.domain}
                </Typography>
              </Box>
            )}
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                {t('jsonEditor.fields.user')}:{' '}
                {maskValue(rdpEntry.user, rdpUserVisible)}
              </Typography>
              <IconButton
                size="small"
                onClick={() => toggleValueVisibility(entry.id, 1)}
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
              >
                {rdpUserVisible ? (
                  <VisibilityOffIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleCopy(entry.id, rdpEntry.user, 1)}
                className="json-editor-copy-btn"
              >
                {copied[entry.id] === 1 ? (
                  <CheckIcon fontSize="small" />
                ) : (
                  <ContentCopyIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() =>
                  handleAddToHotCopy(entryIndex, 'user', rdpEntry.user)
                }
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
                title={t('hotcopy.addToHotCopy') || 'Add to quick copy'}
              >
                <BookmarkAddIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{ color: 'var(--text-secondary)' }}
              >
                {t('jsonEditor.fields.password')}:{' '}
                {maskValue(rdpEntry.password, rdpPasswordVisible, true)}
              </Typography>
              <IconButton
                size="small"
                onClick={() => togglePasswordVisibility(entry.id)}
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
              >
                {rdpPasswordVisible ? (
                  <VisibilityOffIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleCopy(entry.id, rdpEntry.password, 2)}
                className="json-editor-copy-btn"
              >
                {copied[entry.id] === 2 ? (
                  <CheckIcon fontSize="small" />
                ) : (
                  <ContentCopyIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() =>
                  handleAddToHotCopy(entryIndex, 'password', rdpEntry.password)
                }
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
                title={t('hotcopy.addToHotCopy') || 'Add to quick copy'}
              >
                <BookmarkAddIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        );
      }
      case 'webLogin': {
        const webEntry = entry as WebLoginEntry;
        const webPasswordVisible = visiblePasswords.has(entry.id);
        const webUrlVisible = visibleValues.has(`${entry.id}-0`);
        const webUserVisible = visibleValues.has(`${entry.id}-1`);
        return (
          <Box>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                {t('jsonEditor.fields.url')}:{' '}
                {maskValue(webEntry.url, webUrlVisible)}
              </Typography>
              <IconButton
                size="small"
                onClick={() => toggleValueVisibility(entry.id, 0)}
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
              >
                {webUrlVisible ? (
                  <VisibilityOffIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleCopy(entry.id, webEntry.url, 0)}
                className="json-editor-copy-btn"
              >
                {copied[entry.id] === 0 ? (
                  <CheckIcon fontSize="small" />
                ) : (
                  <ContentCopyIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() =>
                  handleAddToHotCopy(entryIndex, 'url', webEntry.url)
                }
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
                title={t('hotcopy.addToHotCopy') || 'Add to quick copy'}
              >
                <BookmarkAddIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                {t('jsonEditor.fields.login')}:{' '}
                {maskValue(webEntry.user, webUserVisible)}
              </Typography>
              <IconButton
                size="small"
                onClick={() => toggleValueVisibility(entry.id, 1)}
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
              >
                {webUserVisible ? (
                  <VisibilityOffIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleCopy(entry.id, webEntry.user, 1)}
                className="json-editor-copy-btn"
              >
                {copied[entry.id] === 1 ? (
                  <CheckIcon fontSize="small" />
                ) : (
                  <ContentCopyIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() =>
                  handleAddToHotCopy(entryIndex, 'user', webEntry.user)
                }
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
                title={t('hotcopy.addToHotCopy') || 'Add to quick copy'}
              >
                <BookmarkAddIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{ color: 'var(--text-secondary)' }}
              >
                {t('jsonEditor.fields.password')}:{' '}
                {maskValue(webEntry.password, webPasswordVisible, true)}
              </Typography>
              <IconButton
                size="small"
                onClick={() => togglePasswordVisibility(entry.id)}
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
              >
                {webPasswordVisible ? (
                  <VisibilityOffIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleCopy(entry.id, webEntry.password, 2)}
                className="json-editor-copy-btn"
              >
                {copied[entry.id] === 2 ? (
                  <CheckIcon fontSize="small" />
                ) : (
                  <ContentCopyIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() =>
                  handleAddToHotCopy(entryIndex, 'password', webEntry.password)
                }
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
                title={t('hotcopy.addToHotCopy') || 'Add to quick copy'}
              >
                <BookmarkAddIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        );
      }
      default:
        return null;
    }
  };

  return (
    <Box className="json-editor-root">
      <Box className="json-editor-header">
        <Typography variant="h6" className="json-editor-title">
          {t('jsonEditor.title') || 'JSON Entries'}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            gap: 2,
          }}
        >
          {/* Search field - only show in structured mode */}
          {entries.length > 0 && editMode === 'structured' && (
            <TextField
              size="small"
              placeholder={t('jsonEditor.search') || 'Pesquisar...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 250, ml: 2, ...dialogStyles.textField }}
            />
          )}

          {/* Spacer to push the controls to the right */}
          <Box sx={{ flex: 1 }} />

          {/* Right: Add (first in this group), eye (penultimate) and menu (last) */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {editMode === 'structured' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddEntry}
                className="json-editor-add-btn"
              >
                {t('jsonEditor.addEntry') || 'Add Entry'}
              </Button>
            )}
            {entries.length > 0 && editMode === 'structured' && (
              <IconButton
                onClick={toggleShowAll}
                title={
                  showAll
                    ? t('jsonEditor.hideAll') || 'Hide All'
                    : t('jsonEditor.showAll') || 'Show All'
                }
                sx={{
                  color: 'var(--text-primary)',
                  '&:hover': {
                    backgroundColor: 'rgba(33, 150, 243, 0.12)',
                  },
                }}
              >
                {showAll ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            )}

            <IconButton
              onClick={toggleEditMode}
              title={
                editMode === 'structured'
                  ? t('jsonEditor.switchToRaw') || 'Edit as raw text'
                  : t('jsonEditor.switchToStructured') || 'Edit as structured'
              }
              sx={{
                color: 'var(--text-primary)',
                '&:hover': {
                  backgroundColor: 'rgba(33, 150, 243, 0.12)',
                },
              }}
            >
              {editMode === 'structured' ? <CodeIcon /> : <TableChartIcon />}
            </IconButton>

            {entries.length > 0 && (
              <IconButton
                onClick={handleMenuOpen}
                title={t('jsonEditor.menu') || 'Options'}
                sx={{
                  color: 'var(--text-primary)',
                  '&:hover': {
                    backgroundColor: 'rgba(33, 150, 243, 0.12)',
                  },
                }}
              >
                <MoreVertIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      </Box>

      <Menu
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            className: 'app-menu-paper',
          },
        }}
      >
        <MenuItem
          onClick={handleCreateNewFromCurrent}
          className="app-menu-item"
        >
          <ListItemIcon className="app-menu-icon">
            <FileCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {t('jsonEditor.createNewFromCurrent') ||
              'Create new file from current'}
          </ListItemText>
        </MenuItem>
      </Menu>

      {editMode === 'structured' ? (
        <>
          {entries.length === 0 && (
            <Box className="json-editor-empty">
              <Typography>
                {t('jsonEditor.empty') ||
                  'No entries yet. Click "Add Entry" to create one.'}
              </Typography>
            </Box>
          )}

          {entries.length > 0 && filteredEntries.length === 0 && (
            <Box className="json-editor-empty">
              <Typography>
                {t('jsonEditor.noSearchResults') ||
                  'Nenhum resultado encontrado para a pesquisa.'}
              </Typography>
            </Box>
          )}

          {filteredEntries.length > 0 && (
            <TableContainer
              component={Paper}
              className="app-scroll json-editor-table-container"
            >
              <Table stickyHeader className="json-editor-table">
                <TableHead>
                  <TableRow>
                    <TableCell className="json-editor-table-head json-editor-order-col">
                      {/* Order column */}
                    </TableCell>
                    <TableCell className="json-editor-table-head">
                      {t('jsonEditor.fields.title') || 'Title'}
                    </TableCell>
                    <TableCell className="json-editor-table-head">
                      {t('jsonEditor.fields.value') || 'Value'}
                    </TableCell>
                    <TableCell align="right" className="json-editor-table-head">
                      {t('jsonEditor.actions') || 'Actions'}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEntries.map((entry, index) => (
                    <TableRow key={entry.id} className="json-editor-row">
                      <TableCell className="json-editor-cell json-editor-order-cell">
                        <Box className="json-editor-order-buttons">
                          <IconButton
                            size="small"
                            onClick={() =>
                              moveEntry(entries.indexOf(entry), 'up')
                            }
                            className="move-up-btn"
                            disabled={entries.indexOf(entry) === 0}
                          >
                            <ArrowUpwardIcon fontSize="inherit" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() =>
                              moveEntry(entries.indexOf(entry), 'down')
                            }
                            className="move-down-btn"
                            disabled={
                              entries.indexOf(entry) === entries.length - 1
                            }
                          >
                            <ArrowDownwardIcon fontSize="inherit" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell className="json-editor-cell">
                        {entry.title}
                      </TableCell>
                      <TableCell className="json-editor-cell">
                        {renderEntryValue(entry, index)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="json-editor-cell json-editor-actions"
                      >
                        {entry.type === 'ssh' && (
                          <IconButton
                            size="small"
                            onClick={() => {
                              const sshEntry = entry as SshEntry;
                              const { sshAPI } = window as any;
                              if (sshAPI) {
                                sshAPI.openWindow({
                                  host: sshEntry.host,
                                  port: sshEntry.port,
                                  user: sshEntry.user,
                                  password: sshEntry.password,
                                  title: sshEntry.title,
                                });
                              }
                            }}
                            title={t('ssh.connect') || 'Connect'}
                            sx={{
                              color: '#a6e3a1',
                              '&:hover': {
                                backgroundColor: 'rgba(166, 227, 161, 0.12)',
                              },
                            }}
                          >
                            <TerminalIcon fontSize="small" />
                          </IconButton>
                        )}
                        {entry.type === 'rdp' && (
                          <IconButton
                            size="small"
                            onClick={() => {
                              const rdpEntry = entry as RdpEntry;
                              const { rdpAPI } = window as any;
                              if (rdpAPI) {
                                rdpAPI.connect({
                                  host: rdpEntry.host,
                                  port: rdpEntry.port,
                                  user: rdpEntry.user,
                                  password: rdpEntry.password,
                                  domain: rdpEntry.domain,
                                  title: rdpEntry.title,
                                });
                              }
                            }}
                            title={t('rdp.connect') || 'Connect RDP'}
                            sx={{
                              color: '#89b4fa',
                              '&:hover': {
                                backgroundColor: 'rgba(137, 180, 250, 0.12)',
                              },
                            }}
                          >
                            <TerminalIcon fontSize="small" />
                          </IconButton>
                        )}
                        {entry.type === 'webLogin' && (
                          <IconButton
                            size="small"
                            onClick={async () => {
                              const webEntry = entry as WebLoginEntry;
                              const { webLoginAPI } = window;
                              if (!webLoginAPI) {
                                return;
                              }
                              try {
                                const result = await webLoginAPI.open({
                                  url: webEntry.url,
                                  user: webEntry.user,
                                  password: webEntry.password,
                                  title: webEntry.title,
                                });
                                if (!result?.success) {
                                  showNotification(
                                    result?.error ||
                                      t('webLogin.openError') ||
                                      'Could not open the site',
                                    'error',
                                  );
                                }
                              } catch {
                                showNotification(
                                  t('webLogin.openError') ||
                                    'Could not open the site',
                                  'error',
                                );
                              }
                            }}
                            title={t('webLogin.open') || 'Open and fill login'}
                            sx={{
                              color: '#94e2d5',
                              '&:hover': {
                                backgroundColor: 'rgba(148, 226, 213, 0.12)',
                              },
                            }}
                          >
                            <LanguageIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleDuplicateEntry(entry)}
                          className="duplicate-btn"
                          title={t('jsonEditor.duplicate') || 'Duplicate entry'}
                          sx={{
                            color: 'var(--primary-blue)',
                            '&:hover': {
                              backgroundColor: 'rgba(33, 150, 243, 0.12)',
                            },
                          }}
                        >
                          <CopyAllIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEditEntry(entry)}
                          className="edit-btn"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteEntry(entry)}
                          className="delete-btn"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      ) : (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            p: 2,
          }}
        >
          <TextField
            multiline
            fullWidth
            value={rawJsonText}
            onChange={(e) => {
              setRawJsonText(e.target.value);
              onContentChange(e.target.value);
            }}
            sx={{
              flex: 1,
              '& .MuiInputBase-root': {
                height: '100%',
                alignItems: 'flex-start',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
              },
              '& .MuiInputBase-input': {
                height: '100% !important',
                overflow: 'auto !important',
              },
              ...dialogStyles.textField,
            }}
            className="json-editor-raw-textfield"
            placeholder={
              t('jsonEditor.rawPlaceholder') || 'Edit JSON as text...'
            }
          />
        </Box>
      )}

      <JsonEntryDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onConfirm={handleDialogConfirm}
        editingEntry={editingEntry}
        duplicateData={duplicateData}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('jsonEditor.deleteConfirm.title') || 'Delete Entry'}
        message={
          t('jsonEditor.deleteConfirm.message') ||
          'Are you sure you want to delete this entry?'
        }
        confirmLabel={t('dialog.actions.delete') || 'Delete'}
        cancelLabel={t('dialog.actions.cancel') || 'Cancel'}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />

      {hotCopyData && (
        <HotCopyDialog
          open={hotCopyDialogOpen}
          onClose={() => {
            setHotCopyDialogOpen(false);
            setHotCopyData(null);
          }}
          onConfirm={handleHotCopyConfirm}
          filePath={currentFilePath}
          entryIndex={hotCopyData.entryIndex}
          fieldName={hotCopyData.fieldName}
          currentValue={hotCopyData.value}
          occupiedPositions={hotCopyOccupied}
        />
      )}
    </Box>
  );
}
