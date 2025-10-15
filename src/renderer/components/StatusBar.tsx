import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import './StatusBar.css';

interface StatusBarProps {
  currentFile?: string;
  isEncrypted?: boolean;
  wordCount?: number;
  status?: string;
}

export default function StatusBar({
  currentFile,
  isEncrypted = false,
  wordCount = 0,
  status = 'Ready',
}: StatusBarProps) {
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
      {/* Left side - Current file and encryption status */}
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
              {isEncrypted && ' (Encrypted)'}
            </>
          ) : (
            'No file open'
          )}
        </Typography>

        {status && (
          <Typography
            variant="caption"
            sx={{
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              opacity: 0.7,
            }}
          >
            • {status}
          </Typography>
        )}
      </Box>

      {/* Right side - Word count and app info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
