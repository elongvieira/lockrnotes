import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useTranslation } from 'react-i18next';
import { dialogStyles } from '../styles/dialogStyles';
import '@xterm/xterm/css/xterm.css';

interface SshTerminalDialogProps {
  open: boolean;
  onClose: () => void;
  host: string;
  user: string;
  password: string;
  title: string;
}

export default function SshTerminalDialog({
  open,
  onClose,
  host,
  user,
  password,
  title,
}: SshTerminalDialogProps) {
  const { t } = useTranslation();
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<
    'connecting' | 'connected' | 'error' | 'closed'
  >('connecting');
  const [_errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!open) return undefined;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: '#1e1e2e',
        foreground: '#cdd6f4',
        cursor: '#f5e0dc',
        selectionBackground: '#585b70',
      },
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    termInstance.current = term;
    fitAddon.current = fit;

    // Small delay to ensure DOM is ready
    const mountTimer = setTimeout(() => {
      if (terminalRef.current) {
        term.open(terminalRef.current);
        fit.fit();

        // Auto-copy selected text to clipboard
        term.onSelectionChange(() => {
          const sel = term.getSelection();
          if (sel) {
            navigator.clipboard.writeText(sel).catch(() => {});
          }
        });

        term.writeln(`Connecting to ${host}...`);
      }
    }, 100);

    // Connect via SSH
    const { sshAPI } = window as any;
    if (!sshAPI) {
      setStatus('error');
      setErrorMsg('SSH API not available');
      return () => clearTimeout(mountTimer);
    }

    let removeDataListener: (() => void) | null = null;
    let removeClosedListener: (() => void) | null = null;

    const connect = async () => {
      try {
        const result = await sshAPI.connect({ host, user, password });

        if (!result.success) {
          setStatus('error');
          setErrorMsg(result.error || 'Connection failed');
          term.writeln(
            `\r\n\x1b[31mError: ${result.error || 'Connection failed'}\x1b[0m`,
          );
          return;
        }

        sessionIdRef.current = result.sessionId;
        setStatus('connected');

        // Listen for SSH data
        removeDataListener = sshAPI.onData((sid: string, data: string) => {
          if (sid === result.sessionId) {
            term.write(data);
          }
        });

        // Listen for connection closed
        removeClosedListener = sshAPI.onClosed((sid: string) => {
          if (sid === result.sessionId) {
            term.writeln('\r\n\x1b[33mConnection closed.\x1b[0m');
            setStatus('closed');
            sessionIdRef.current = null;
          }
        });

        // Send terminal input to SSH
        term.onData((data) => {
          if (sessionIdRef.current) {
            sshAPI.sendInput(sessionIdRef.current, data);
          }
        });

        // Handle terminal resize
        term.onResize(({ cols, rows }) => {
          if (sessionIdRef.current) {
            sshAPI.resize(sessionIdRef.current, cols, rows);
          }
        });

        // Initial resize
        if (fitAddon.current) {
          fitAddon.current.fit();
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || 'Connection failed');
        term.writeln(`\r\n\x1b[31mError: ${err.message}\x1b[0m`);
      }
    };

    connect();

    // Handle window resize
    const handleResize = () => {
      if (fitAddon.current) {
        fitAddon.current.fit();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(mountTimer);
      window.removeEventListener('resize', handleResize);
      if (removeDataListener) removeDataListener();
      if (removeClosedListener) removeClosedListener();

      // Disconnect SSH
      if (sessionIdRef.current && sshAPI) {
        sshAPI.disconnect(sessionIdRef.current);
        sessionIdRef.current = null;
      }

      term.dispose();
      termInstance.current = null;
      fitAddon.current = null;
      setStatus('connecting');
      setErrorMsg('');
    };
  }, [open, host, user, password]);

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          ...dialogStyles.dialogPaper,
          minHeight: '500px',
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle sx={dialogStyles.dialogTitle}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          SSH: {title} ({user}@{host})
          {status === 'connecting' && (
            <CircularProgress size={18} sx={{ color: 'var(--primary-blue)' }} />
          )}
          {status === 'connected' && (
            <Typography variant="caption" sx={{ color: '#a6e3a1', ml: 1 }}>
              {t('ssh.connected') || 'Connected'}
            </Typography>
          )}
          {status === 'error' && (
            <Typography variant="caption" sx={{ color: '#f38ba8', ml: 1 }}>
              {t('ssh.error') || 'Error'}
            </Typography>
          )}
          {status === 'closed' && (
            <Typography variant="caption" sx={{ color: '#fab387', ml: 1 }}>
              {t('ssh.disconnected') || 'Disconnected'}
            </Typography>
          )}
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          ...dialogStyles.dialogContent,
          p: 0,
          overflow: 'hidden',
        }}
      >
        <Box
          ref={terminalRef}
          sx={{
            width: '100%',
            height: '400px',
            backgroundColor: '#1e1e2e',
            '& .xterm': {
              padding: '8px',
              height: '100%',
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={dialogStyles.dialogActions}>
        <Button onClick={handleClose} sx={dialogStyles.cancelButton}>
          {t('ssh.disconnect') || 'Disconnect'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
