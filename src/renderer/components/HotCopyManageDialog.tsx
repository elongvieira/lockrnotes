import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { SxProps, Theme } from '@mui/material/styles';
import { HotCopyItem } from '../types/hotcopy';
import { dialogStyles } from '../styles/dialogStyles';

interface HotCopyManageDialogProps {
  open: boolean;
  onClose: () => void;
  items: HotCopyItem[];
  onUpdate: () => void;
}

export default function HotCopyManageDialog({
  open,
  onClose,
  items,
  onUpdate,
}: HotCopyManageDialogProps) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState<string>('');

  const handleDelete = async (itemId: string) => {
    try {
      const result = await window.hotCopyAPI?.removeItem(itemId);
      if (result?.success) {
        onUpdate();
        window.dispatchEvent(new Event('hotcopy-updated'));
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleStartEdit = (item: HotCopyItem) => {
    setEditingId(item.id);
    setEditLabel(item.label || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLabel('');
  };

  const handleSaveEdit = async (item: HotCopyItem) => {
    try {
      // Remove old item and add with new label
      await window.hotCopyAPI?.removeItem(item.id);
      const result = await window.hotCopyAPI?.addItem(
        item.filePath,
        item.entryIndex,
        item.fieldName,
        item.position,
        editLabel || undefined,
      );

      if (result?.success) {
        setEditingId(null);
        setEditLabel('');
        onUpdate();
        window.dispatchEvent(new Event('hotcopy-updated'));
      }
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { ...dialogStyles.dialogPaper, marginTop: '16px' },
      }}
    >
      <DialogTitle sx={{ ...dialogStyles.dialogTitle, marginBottom: '8px' }}>
        {t('hotcopy.manage') || 'Manage Hot Copy Slots'}
      </DialogTitle>
      <DialogContent
        sx={
          {
            ...dialogStyles.dialogContent,
            ...dialogStyles.scrollbar,
            paddingTop: '12px',
            maxHeight: '70vh',
            overflowY: 'auto',
          } as SxProps<Theme>
        }
      >
        {items.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography sx={dialogStyles.secondaryText}>
              {t('hotcopy.noItems') || 'No items configured'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ pt: 0 }}>
            {items
              .sort((a, b) => a.position - b.position)
              .map((item) => (
                <ListItem
                  key={item.id}
                  sx={{
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--border-radius-sm)',
                    mb: 2,
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        minWidth: '32px',
                        height: '32px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--primary-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '14px',
                      }}
                    >
                      {item.position}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      {editingId === item.id ? (
                        <TextField
                          size="small"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          placeholder={item.fieldName}
                          fullWidth
                          sx={dialogStyles.textField}
                        />
                      ) : (
                        <>
                          <Typography
                            variant="body2"
                            sx={{ color: 'var(--text-primary)', mb: 0.5 }}
                          >
                            {item.label || item.fieldName}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: 'var(--text-secondary)' }}
                          >
                            {item.filePath.split(/[\\/]/).pop()} -{' '}
                            {t('hotcopy.entry') || 'Entry'} {item.entryIndex} (
                            {item.fieldName})
                          </Typography>
                        </>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {editingId === item.id ? (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleSaveEdit(item)}
                            sx={{
                              color: 'var(--success-green)',
                              '&:hover': {
                                backgroundColor: 'rgba(76, 175, 80, 0.12)',
                              },
                            }}
                          >
                            <SaveIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={handleCancelEdit}
                            sx={{
                              color: 'var(--text-secondary)',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                              },
                            }}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleStartEdit(item)}
                            sx={{
                              color: 'var(--primary-blue)',
                              '&:hover': {
                                backgroundColor: 'rgba(33, 150, 243, 0.12)',
                              },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(item.id)}
                            sx={{
                              color: 'var(--error-red)',
                              '&:hover': {
                                backgroundColor: 'rgba(244, 67, 54, 0.12)',
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </Box>
                </ListItem>
              ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={dialogStyles.dialogActions}>
        <Button onClick={onClose} sx={dialogStyles.confirmButton}>
          {t('common.close') || 'Close'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
