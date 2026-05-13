import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CheckIcon from '@mui/icons-material/Check';
import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import TableChartIcon from '@mui/icons-material/TableChart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from './ConfirmDialog';
import { useAppContext } from '../contexts/AppContext';
import { dialogStyles } from '../styles/dialogStyles';
import './VaultSecretEditor.css';
import JsonEditor from './JsonEditor';

// ---

interface VaultField {
  id: string;
  key: string;
  value: string;
}

interface VaultSecretEditorProps {
  content: string;
  onContentChange: (newContent: string) => void;
  filePath?: string;
}

// ---

/**
 * Keys matching this pattern have their values hidden by default so
 * sensitive credentials are not accidentally exposed.
 */
function isSensitiveKey(key: string): boolean {
  return /password|passphrase|secret|token|private[_-]?key|api[_-]?key|access[_-]?key|client[_-]?secret|master[_-]?key|webhook[_-]?secret|signing[_-]?secret/i.test(
    key,
  );
}

/**
 * Parse a flat JSON object from Vault into an ordered list of fields.
 * Any JSON that is not a plain object returns an empty list.
 */
function parseFields(content: string): VaultField[] {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.entries(parsed as Record<string, unknown>).map(
        ([key, value], i) => ({
          id: `field_${i}_${key}`,
          key,
          value:
            typeof value === 'string' ? value : JSON.stringify(value ?? ''),
        }),
      );
    }
  } catch {
    // fall through â€” return empty
  }
  return [];
}

/**
 * Serialize an ordered list of fields back to a flat JSON object string.
 * Fields with empty keys are skipped.
 */
function serializeFields(fields: VaultField[]): string {
  const obj: Record<string, string> = {};
  for (const f of fields) {
    const k = f.key.trim();
    if (k) obj[k] = f.value;
  }
  return JSON.stringify(obj, null, 2);
}

function newFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ---

export default function VaultSecretEditor({
  content,
  onContentChange,
  filePath = '',
}: VaultSecretEditorProps) {
  const { t } = useTranslation();
  const { showNotification } = useAppContext();

  // ---

  const isJsonPattern = useMemo(() => {
    try {
      const parsed = JSON.parse(content);
      // eslint-disable-next-line no-underscore-dangle
      return parsed && parsed._editor_pattern === 'json';
    } catch {
      return false;
    }
  }, [content]);

  const handleJsonEditorChange = useCallback(
    (newContent: string) => {
      try {
        const parsed = JSON.parse(newContent);
        // eslint-disable-next-line no-underscore-dangle
        parsed._editor_pattern = 'json';
        onContentChange(JSON.stringify(parsed, null, 2));
      } catch {
        onContentChange(newContent);
      }
    },
    [onContentChange],
  );

  // ---

  const [fields, setFields] = useState<VaultField[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleValues, setVisibleValues] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'structured' | 'raw'>('structured');
  const [rawJsonText, setRawJsonText] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<VaultField | null>(null);
  const newFieldKeyRef = useRef<HTMLInputElement | null>(null);

  // Sync fields when content changes externally (e.g. file opened)
  useEffect(() => {
    setFields(parseFields(content));
  }, [content]);

  // ---

  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) return fields;
    const q = searchQuery.toLowerCase();
    return fields.filter(
      (f) =>
        f.key.toLowerCase().includes(q) || f.value.toLowerCase().includes(q),
    );
  }, [fields, searchQuery]);

  const sensitiveFieldIds = useMemo(
    () => fields.filter((f) => isSensitiveKey(f.key)).map((f) => f.id),
    [fields],
  );

  const allSensitiveVisible =
    sensitiveFieldIds.length > 0 &&
    sensitiveFieldIds.every((id) => visibleValues.has(id));

  // ---

  const persist = useCallback(
    (next: VaultField[]) => {
      setFields(next);
      onContentChange(serializeFields(next));
    },
    [onContentChange],
  );

  const updateField = (
    id: string,
    changes: Partial<Omit<VaultField, 'id'>>,
  ) => {
    persist(fields.map((f) => (f.id === id ? { ...f, ...changes } : f)));
  };

  const handleAddField = () => {
    const newField: VaultField = { id: newFieldId(), key: '', value: '' };
    persist([...fields, newField]);
    setTimeout(() => newFieldKeyRef.current?.focus(), 50);
  };

  const handleDeleteRequest = (field: VaultField) => {
    setFieldToDelete(field);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!fieldToDelete) return;
    persist(fields.filter((f) => f.id !== fieldToDelete.id));
    setDeleteConfirmOpen(false);
    setFieldToDelete(null);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    persist(next);
  };

  // ---

  const toggleVisibility = (id: string) => {
    setVisibleValues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllSensitive = () => {
    if (allSensitiveVisible) {
      setVisibleValues((prev) => {
        const next = new Set(prev);
        sensitiveFieldIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setVisibleValues((prev) => new Set([...prev, ...sensitiveFieldIds]));
    }
  };

  // ---

  const handleCopy = async (fieldId: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(fieldId);
      window.setTimeout(
        () => setCopiedId((cur) => (cur === fieldId ? null : cur)),
        1600,
      );
    } catch {
      showNotification(
        t('vault.editor.copyError') || 'Failed to copy',
        'error',
      );
    }
  };

  // ---

  const toggleEditMode = () => {
    if (editMode === 'structured') {
      setRawJsonText(serializeFields(fields));
      setEditMode('raw');
    } else {
      const parsed = parseFields(rawJsonText);
      // If rawJsonText is valid JSON object, apply; otherwise show error
      try {
        JSON.parse(rawJsonText);
        setFields(parsed);
        onContentChange(rawJsonText);
        setEditMode('structured');
      } catch {
        showNotification(t('jsonEditor.parseError') || 'Invalid JSON', 'error');
      }
    }
  };

  // ---

  const secretLabel = filePath
    ? filePath.replace(/^vault:\/\/notes\//, '')
    : t('vault.editor.defaultPath') || 'Vault Secret';

  // ---

  if (isJsonPattern) {
    return (
      <JsonEditor
        content={content}
        onContentChange={handleJsonEditorChange}
        filePath={filePath}
      />
    );
  }

  return (
    <Box className="vault-secret-editor-root">
      {/* */}
      <Box className="vault-secret-editor-header">
        <Typography variant="h6" className="vault-secret-editor-title" noWrap>
          {secretLabel}
        </Typography>

        <Box
          sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}
        >
          {fields.length > 0 && editMode === 'structured' && (
            <TextField
              size="small"
              placeholder={t('vault.editor.search') || 'Search fields...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 250, ml: 2, ...dialogStyles.textField }}
              className="vault-secret-editor-search"
            />
          )}

          <Box sx={{ flex: 1 }} />

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {editMode === 'structured' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddField}
                className="vault-secret-editor-add-btn"
              >
                {t('vault.editor.addField') || 'Add Field'}
              </Button>
            )}

            {sensitiveFieldIds.length > 0 && editMode === 'structured' && (
              <IconButton
                onClick={toggleAllSensitive}
                title={
                  allSensitiveVisible
                    ? t('vault.editor.hidePasswords') || 'Hide sensitive values'
                    : t('vault.editor.showPasswords') || 'Show sensitive values'
                }
                sx={{
                  color: 'var(--text-primary)',
                  '&:hover': { backgroundColor: 'rgba(33, 150, 243, 0.12)' },
                }}
              >
                {allSensitiveVisible ? (
                  <VisibilityOffIcon />
                ) : (
                  <VisibilityIcon />
                )}
              </IconButton>
            )}

            <IconButton
              onClick={toggleEditMode}
              title={
                editMode === 'structured'
                  ? t('jsonEditor.switchToRaw') || 'Edit as JSON'
                  : t('jsonEditor.switchToStructured') || 'Structured view'
              }
              sx={{
                color: 'var(--text-primary)',
                '&:hover': { backgroundColor: 'rgba(33, 150, 243, 0.12)' },
              }}
            >
              {editMode === 'structured' ? <CodeIcon /> : <TableChartIcon />}
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* */}
      {editMode === 'structured' && (
        <>
          {fields.length === 0 && (
            <Box className="vault-secret-editor-empty">
              <Typography>
                {t('vault.editor.emptyTitle') ||
                  'No fields yet. Click "Add Field" to start.'}
              </Typography>
            </Box>
          )}

          {fields.length > 0 && filteredFields.length === 0 && (
            <Box className="vault-secret-editor-empty">
              <Typography>
                {t('vault.editor.noResultsTitle') || 'No results found.'}
              </Typography>
            </Box>
          )}

          {filteredFields.length > 0 && (
            <TableContainer
              component={Paper}
              className="app-scroll vault-secret-editor-table-container"
            >
              <Table stickyHeader className="vault-secret-editor-table">
                <TableHead>
                  <TableRow>
                    <TableCell className="vault-secret-editor-order-col">
                      {/* Order column */}
                    </TableCell>
                    <TableCell>{t('vault.editor.keyLabel') || 'Key'}</TableCell>
                    <TableCell>
                      {t('vault.editor.valueLabel') || 'Value'}
                    </TableCell>
                    <TableCell align="right">
                      {t('vault.editor.actions') || 'Actions'}
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredFields.map((field) => {
                    const sensitive = isSensitiveKey(field.key);
                    const visible = visibleValues.has(field.id);
                    const globalIdx = fields.indexOf(field);
                    const isLast = globalIdx === fields.length - 1;

                    return (
                      <TableRow
                        key={field.id}
                        hover
                        className="vault-secret-editor-row"
                      >
                        {/* Order */}
                        <TableCell className="vault-secret-editor-cell vault-secret-editor-order-cell">
                          <Box className="vault-secret-editor-order-buttons">
                            <IconButton
                              size="small"
                              onClick={() => moveField(globalIdx, 'up')}
                              className="vault-move-btn"
                              disabled={globalIdx === 0}
                              title={t('vault.editor.moveUp') || 'Move up'}
                            >
                              <ArrowUpwardIcon fontSize="inherit" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => moveField(globalIdx, 'down')}
                              className="vault-move-btn"
                              disabled={isLast}
                              title={t('vault.editor.moveDown') || 'Move down'}
                            >
                              <ArrowDownwardIcon fontSize="inherit" />
                            </IconButton>
                          </Box>
                        </TableCell>

                        {/* Key */}
                        <TableCell
                          className="vault-secret-editor-cell"
                          sx={{ verticalAlign: 'middle' }}
                        >
                          <TextField
                            size="small"
                            fullWidth
                            value={field.key}
                            onChange={(e) =>
                              updateField(field.id, { key: e.target.value })
                            }
                            placeholder={t('vault.editor.keyLabel') || 'Key'}
                            sx={dialogStyles.textField}
                            inputRef={
                              isLast && field.key === ''
                                ? newFieldKeyRef
                                : undefined
                            }
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleCopy(field.id, field.key)
                                    }
                                    title={
                                      t('vault.editor.copyField') || 'Copy key'
                                    }
                                    className="vault-entry-copy-btn"
                                  >
                                    {copiedId === field.id ? (
                                      <CheckIcon fontSize="small" />
                                    ) : (
                                      <ContentCopyIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                        </TableCell>

                        {/* Value */}
                        <TableCell
                          className="vault-secret-editor-cell"
                          sx={{ verticalAlign: 'middle' }}
                        >
                          <TextField
                            size="small"
                            fullWidth
                            type={sensitive && !visible ? 'password' : 'text'}
                            value={field.value}
                            onChange={(e) =>
                              updateField(field.id, { value: e.target.value })
                            }
                            placeholder={
                              t('vault.editor.valueLabel') || 'Value'
                            }
                            sx={dialogStyles.textField}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Box sx={{ display: 'flex', gap: 0 }}>
                                    {sensitive && (
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          toggleVisibility(field.id)
                                        }
                                        title={
                                          visible
                                            ? t('vault.editor.hideField') ||
                                              'Hide'
                                            : t('vault.editor.showField') ||
                                              'Show'
                                        }
                                        className="vault-entry-copy-btn"
                                      >
                                        {visible ? (
                                          <VisibilityOffIcon fontSize="small" />
                                        ) : (
                                          <VisibilityIcon fontSize="small" />
                                        )}
                                      </IconButton>
                                    )}
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleCopy(field.id, field.value)
                                      }
                                      title={
                                        t('vault.editor.copyField') ||
                                        'Copy value'
                                      }
                                      className="vault-entry-copy-btn"
                                    >
                                      {copiedId === field.id ? (
                                        <CheckIcon fontSize="small" />
                                      ) : (
                                        <ContentCopyIcon fontSize="small" />
                                      )}
                                    </IconButton>
                                  </Box>
                                </InputAdornment>
                              ),
                            }}
                          />
                        </TableCell>

                        {/* Actions */}
                        <TableCell
                          align="right"
                          className="vault-secret-editor-cell vault-secret-editor-actions"
                          sx={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteRequest(field)}
                            title={
                              t('vault.editor.deleteField') || 'Delete field'
                            }
                            className="delete-btn"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* */}
      {editMode === 'raw' && (
        <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
          <TextField
            multiline
            fullWidth
            value={rawJsonText}
            onChange={(e) => setRawJsonText(e.target.value)}
            variant="outlined"
            minRows={20}
            sx={{
              flex: 1,
              ...dialogStyles.textField,
              '& .MuiInputBase-root': {
                fontFamily: 'monospace',
              },
            }}
          />
        </Box>
      )}

      {/* */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('vault.editor.deleteField') || 'Delete field'}
        message={
          fieldToDelete
            ? (
                t('vault.editor.deleteConfirm') || 'Delete field "{key}"?'
              ).replace('{key}', fieldToDelete.key)
            : ''
        }
        confirmLabel={t('dialog.actions.delete') || 'Delete'}
        cancelLabel={t('dialog.actions.cancel') || 'Cancel'}
        onConfirm={handleDeleteConfirm}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setFieldToDelete(null);
        }}
      />
    </Box>
  );
}
