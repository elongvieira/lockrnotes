import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import { HotCopyItem } from '../types/hotcopy';
import './HotCopyBar.css';

interface HotCopyBarProps {
  onAddSlot?: (position: number) => void;
  onManage?: () => void;
}

export default function HotCopyBar({ onAddSlot, onManage }: HotCopyBarProps) {
  const { t } = useTranslation();
  const [hotCopyItems, setHotCopyItems] = useState<HotCopyItem[]>([]);
  const maxSlots = 7;

  useEffect(() => {
    loadHotCopyItems();

    // Listen for updates to hot copy items
    const handleUpdate = () => {
      loadHotCopyItems();
    };

    window.addEventListener('hotcopy-updated', handleUpdate);
    return () => {
      window.removeEventListener('hotcopy-updated', handleUpdate);
    };
  }, []);

  const loadHotCopyItems = async () => {
    try {
      const config = await window.electron?.filesystem?.readConfig();
      if (config?.hotCopy?.items) {
        setHotCopyItems(config.hotCopy.items);
      }
    } catch (error) {
      console.error('Failed to load hot copy items:', error);
    }
  };

  const handleCopy = async (item: HotCopyItem) => {
    try {
      // Fetch current value from file
      const value = await window.hotCopyAPI?.getValue(
        item.filePath,
        item.entryIndex,
        item.fieldName,
      );

      if (value !== undefined && value !== null) {
        await navigator.clipboard.writeText(String(value));
        window.dispatchEvent(
          new CustomEvent('show-notification', {
            detail: {
              message:
                t('hotcopy.copied', { label: item.label || item.fieldName }) ||
                'Value copied!',
              severity: 'success',
            },
          }),
        );
      }
    } catch (error) {
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: {
            message: t('hotcopy.copyError') || 'Failed to copy value',
            severity: 'error',
          },
        }),
      );
    }
  };

  const renderSlots = () => {
    const slots = [];
    for (let i = 1; i <= maxSlots; i += 1) {
      const item = hotCopyItems.find((it) => it.position === i);

      if (item) {
        const displayLabel = item.label || item.fieldName;
        const shouldEllipsis = displayLabel.length > 7;
        const truncatedLabel = shouldEllipsis
          ? `${displayLabel.substring(0, 7)}...`
          : displayLabel;

        slots.push(
          <Tooltip
            key={i}
            title={`${displayLabel} (${t('hotcopy.clickToCopy')})`}
          >
            <Box
              className={`hotcopy-slot filled${i === 1 ? ' first-slot' : ''}`}
              onClick={() => handleCopy(item)}
            >
              <ContentCopyIcon fontSize="small" className="hotcopy-icon" />
              <span className="hotcopy-label">{truncatedLabel}</span>
            </Box>
          </Tooltip>,
        );
      } else {
        slots.push(
          <Box
            key={i}
            className={`hotcopy-slot empty${i === 1 ? ' first-slot' : ''}`}
            onClick={() => onAddSlot?.(i)}
          >
            <AddIcon fontSize="small" className="hotcopy-icon" />
            <span className="hotcopy-label">{i}</span>
          </Box>,
        );
      }
    }
    return slots;
  };

  return (
    <Box className="hotcopy-bar">
      {renderSlots()}
      <Tooltip title={t('hotcopy.manage') || 'Manage slots'}>
        <IconButton
          size="small"
          onClick={onManage}
          sx={{
            color: 'var(--text-secondary)',
            marginLeft: '8px',
            '&:hover': {
              color: 'var(--primary-blue)',
            },
          }}
        >
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
