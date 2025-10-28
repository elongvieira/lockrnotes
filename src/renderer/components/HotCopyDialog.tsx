import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import { dialogStyles } from '../styles/dialogStyles';

interface HotCopyDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (position: number, label?: string) => void;
  filePath: string;
  entryIndex: number;
  fieldName: string;
  currentValue?: string;
  occupiedPositions?: number[];
}

export default function HotCopyDialog({
  open,
  onClose,
  onConfirm,
  filePath,
  entryIndex,
  fieldName,
  currentValue = '',
  occupiedPositions = [],
}: HotCopyDialogProps) {
  const { t } = useTranslation();
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [customLabel, setCustomLabel] = useState<string>('');

  const handleClose = () => {
    setSelectedPosition(null);
    setCustomLabel('');
    onClose();
  };

  const handleConfirm = () => {
    if (selectedPosition !== null) {
      onConfirm(selectedPosition, customLabel || undefined);
      handleClose();
    }
  };

  const handlePositionChange = (
    _event: React.MouseEvent<HTMLElement>,
    newPosition: number | null,
  ) => {
    if (newPosition !== null) {
      setSelectedPosition(newPosition);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: dialogStyles.dialogPaper,
      }}
    >
      <DialogTitle sx={dialogStyles.dialogTitle}>
        {t('hotcopy.selectPosition') || 'Add to Quick Copy'}
      </DialogTitle>
      <DialogContent sx={dialogStyles.dialogContent}>
        <Box sx={{ mb: 2, mt: 2 }}>
          <Box sx={{ ...dialogStyles.secondaryText, mb: 1 }}>
            {t('hotcopy.file')}: {filePath.split(/[\\/]/).pop()}
          </Box>
          <Box sx={{ ...dialogStyles.secondaryText, mb: 1 }}>
            {t('hotcopy.path')}: Entry {entryIndex} ({fieldName})
          </Box>
          {currentValue && (
            <Box sx={{ ...dialogStyles.secondaryText, mb: 2 }}>
              {t('hotcopy.currentValue')}: <strong>{currentValue}</strong>
            </Box>
          )}
        </Box>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ ...dialogStyles.secondaryText, mb: 2 }}>
            {t('hotcopy.selectSlot')}:
          </Box>
          <ToggleButtonGroup
            value={selectedPosition}
            exclusive
            onChange={handlePositionChange}
            aria-label="position selection"
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              '& .MuiToggleButton-root': {
                flex: '1 1 calc(14.28% - 8px)',
              },
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((pos) => (
              <ToggleButton
                key={pos}
                value={pos}
                disabled={occupiedPositions.includes(pos)}
                sx={{
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)',
                  padding: '8px 4px',
                  minWidth: '36px',
                  '&.Mui-selected': {
                    backgroundColor: 'var(--primary-blue)',
                    color: 'var(--text-primary)',
                    '&:hover': {
                      backgroundColor: 'var(--primary-blue-dark)',
                    },
                  },
                  '&.Mui-disabled': {
                    color: 'var(--text-disabled)',
                    backgroundColor: 'var(--disabled-bg)',
                  },
                }}
              >
                {pos}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        <TextField
          label={t('hotcopy.customLabel') || 'Custom Label (optional)'}
          value={customLabel}
          onChange={(e) => setCustomLabel(e.target.value)}
          fullWidth
          placeholder={fieldName}
          variant="outlined"
          sx={dialogStyles.textField}
        />
      </DialogContent>
      <DialogActions sx={dialogStyles.dialogActions}>
        <Button onClick={handleClose} sx={dialogStyles.cancelButton}>
          {t('common.cancel') || 'Cancel'}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={selectedPosition === null}
          sx={dialogStyles.confirmButton}
        >
          {t('common.add') || 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
