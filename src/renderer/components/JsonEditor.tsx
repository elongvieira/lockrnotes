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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';
import {
  JsonEntry,
  KeyValueEntry,
  TitlePasswordEntry,
  TitleValuePasswordEntry,
  TitleTwoValuesPasswordEntry,
  parseJsonContent,
  serializeJsonContent,
  createEntry,
} from '../types/jsonEntry';
import JsonEntryDialog from './JsonEntryDialog';
import ConfirmDialog from './ConfirmDialog';
import './JsonEditor.css';

interface JsonEditorProps {
  content: string;
  onContentChange: (newContent: string) => void;
}

export default function JsonEditor({
  content,
  onContentChange,
}: JsonEditorProps) {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<JsonEntry[]>([]);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<JsonEntry | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [entryToDelete, setEntryToDelete] = useState<JsonEntry | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(
    new Set(),
  );
  const [copied, setCopied] = useState<Record<string, number | null>>({});

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

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingEntry(null);
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

  const renderEntryValue = (entry: JsonEntry) => {
    switch (entry.type) {
      case 'keyValue':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
              {(entry as KeyValueEntry).value}
            </Typography>
            <IconButton
              size="small"
              onClick={() =>
                handleCopy(entry.id, (entry as KeyValueEntry).value)
              }
              className="json-editor-copy-btn"
            >
              {copied[entry.id] === 0 ? (
                <CheckIcon fontSize="small" />
              ) : (
                <ContentCopyIcon fontSize="small" />
              )}
            </IconButton>
          </Box>
        );
      case 'titlePassword': {
        const tpEntry = entry as TitlePasswordEntry;
        const tpVisible = visiblePasswords.has(entry.id);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
              {t('jsonEditor.fields.password')}:{' '}
              {tpVisible ? tpEntry.password : '••••••••'}
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
          </Box>
        );
      }
      case 'titleValuePassword': {
        const tvpEntry = entry as TitleValuePasswordEntry;
        const tvpVisible = visiblePasswords.has(entry.id);
        return (
          <Box>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                {tvpEntry.value}
              </Typography>
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
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{ color: 'var(--text-secondary)' }}
              >
                {t('jsonEditor.fields.password')}:{' '}
                {tvpVisible ? tvpEntry.password : '••••••••'}
              </Typography>
              <IconButton
                size="small"
                onClick={() => togglePasswordVisibility(entry.id)}
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
              >
                {tvpVisible ? (
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
            </Box>
          </Box>
        );
      }
      case 'titleTwoValuesPassword': {
        const ttpEntry = entry as TitleTwoValuesPasswordEntry;
        const ttpVisible = visiblePasswords.has(entry.id);
        return (
          <Box>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                {ttpEntry.value1}
              </Typography>
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
            </Box>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                {ttpEntry.value2}
              </Typography>
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
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{ color: 'var(--text-secondary)' }}
              >
                {t('jsonEditor.fields.password')}:{' '}
                {ttpVisible ? ttpEntry.password : '••••••••'}
              </Typography>
              <IconButton
                size="small"
                onClick={() => togglePasswordVisibility(entry.id)}
                sx={{
                  color: 'var(--text-secondary)',
                  '&:hover': { color: 'var(--primary-blue)' },
                }}
              >
                {ttpVisible ? (
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddEntry}
          className="json-editor-add-btn"
        >
          {t('jsonEditor.addEntry') || 'Add Entry'}
        </Button>
      </Box>

      {entries.length === 0 ? (
        <Box className="json-editor-empty">
          <Typography>
            {t('jsonEditor.empty') ||
              'No entries yet. Click "Add Entry" to create one.'}
          </Typography>
        </Box>
      ) : (
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
              {entries.map((entry) => (
                <TableRow key={entry.id} className="json-editor-row">
                  <TableCell className="json-editor-cell json-editor-order-cell">
                    <Box className="json-editor-order-buttons">
                      <IconButton
                        size="small"
                        onClick={() => moveEntry(entries.indexOf(entry), 'up')}
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
                        disabled={entries.indexOf(entry) === entries.length - 1}
                      >
                        <ArrowDownwardIcon fontSize="inherit" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell className="json-editor-cell">
                    {entry.title}
                  </TableCell>
                  <TableCell className="json-editor-cell">
                    {renderEntryValue(entry)}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="json-editor-cell json-editor-actions"
                  >
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

      <JsonEntryDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onConfirm={handleDialogConfirm}
        editingEntry={editingEntry}
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
    </Box>
  );
}
