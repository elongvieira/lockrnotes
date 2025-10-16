import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import DoneIcon from '@mui/icons-material/Done';
import EditIcon from '@mui/icons-material/Edit';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../contexts/AppContext';
import './StatusBar.css';

export default function StatusBar() {
  const { currentFile, isEncrypted, wordCount, tabs, activeTab, lastSavedAt } =
    useAppContext();

  const [pulse, setPulse] = useState(false);
  const { t } = useTranslation();

  // Determine active tab dirty state
  const activeTabObj = tabs.find((tabItem) => tabItem.id === activeTab);
  const isDirty = !!activeTabObj?.isDirty;

  // Pulse animation when lastSavedAt changes
  useEffect(() => {
    if (!lastSavedAt) return;
    setPulse(true);
    const id = setTimeout(() => setPulse(false), 700);
    // cleanup
    return function cleanup() {
      clearTimeout(id);
    };
  }, [lastSavedAt]);

  // compute color for status indicator
  let statusColor = 'var(--success-muted)';
  if (pulse) statusColor = 'var(--success)';
  else if (isDirty) statusColor = 'var(--warning)';

  // Hide saved/unsaved indicator when no file open
  const showSaveIndicator = !!currentFile;

  return (
    <Box
      className="status-bar"
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 16px',
        minHeight: '32px',
        backgroundColor: 'var(--bg-tertiary)',
        borderTop: '1px solid var(--border-primary)',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        flexShrink: 0,
        zIndex: 100,
      }}
    >
      {/* Left side - Current file */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
          }}
        >
          {currentFile ? (
            <>
              {isEncrypted && '🔒 '}
              {currentFile}
            </>
          ) : (
            ''
          )}
        </Typography>
      </Box>

      {/* Right side - Word count and app info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {showSaveIndicator && (
          <Box
            className={pulse ? 'save-pulse' : ''}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              transition: 'color 0.25s ease-in-out',
              color: statusColor,
            }}
          >
            {isDirty ? (
              <EditIcon fontSize="small" />
            ) : (
              <DoneIcon fontSize="small" />
            )}
            <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
              {isDirty ? t('status.unsaved') : t('status.saved')}
            </Typography>
          </Box>
        )}

        {wordCount > 0 && (
          <Typography
            variant="caption"
            sx={{
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
            }}
          >
            {wordCount} words
          </Typography>
        )}

        <Typography
          variant="caption"
          sx={{
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            opacity: 0.7,
          }}
        >
          LockrNotes v2.0
        </Typography>
      </Box>
    </Box>
  );
}
