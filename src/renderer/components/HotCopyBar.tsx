/* eslint-disable react/require-default-props */
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

export default function HotCopyBar({
  onAddSlot = () => {},
  onManage = () => {},
}: HotCopyBarProps) {
  const { t } = useTranslation();
  const [hotCopyItems, setHotCopyItems] = useState<HotCopyItem[]>([]);
  const maxSlots = 7;
  // Load items function must be declared before useEffect to avoid 'used before defined'
  async function loadHotCopyItems() {
    try {
      const config = await window.electron?.filesystem?.readConfig();
      if (config?.hotCopy?.items) {
        setHotCopyItems(config.hotCopy.items);
      }
    } catch {
      // notify user instead of console.error to satisfy lint rules
      window.dispatchEvent(
        new CustomEvent('show-notification', {
          detail: {
            message: t('hotcopy.loadError') || 'Failed to load hot copy items',
            severity: 'error',
          },
        }),
      );
    }
  }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    } catch {
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
        // reduce ellipsis threshold to make labels shorter in the top bar
        const shouldEllipsis = displayLabel.length > 6;
        const truncatedLabel = shouldEllipsis
          ? `${displayLabel.substring(0, 6)}...`
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
          className="hotcopy-manage-btn"
        >
          <SettingsIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
