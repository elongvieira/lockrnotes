import React, { useEffect, useRef, useState } from 'react';
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
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!lastSavedAt) return;
    // clear existing timer if any
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPulse(true);
    timerRef.current = window.setTimeout(() => {
      setPulse(false);
      timerRef.current = null;
    }, 700) as unknown as number;
    // no return to satisfy linter rule
  }, [lastSavedAt]);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

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
            {t('status.words', { count: wordCount }) || `${wordCount} words`}
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
