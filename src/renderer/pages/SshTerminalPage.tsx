import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, CircularProgress, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TerminalIcon from '@mui/icons-material/Terminal';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import '../theme.css';

interface SshConfig {
  host: string;
  user: string;
  password: string;
  port?: number;
  title: string;
}

export default function SshTerminalPage() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<
    'loading' | 'connecting' | 'connected' | 'error' | 'closed'
  >('loading');
  const [config, setConfig] = useState<SshConfig | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const token = window.location.hash.split('/')[1] ?? '';

  useEffect(() => {
    const { sshAPI } = window as any;
    if (!sshAPI || !token) {
      setStatus('error');
      setErrorMsg('Missing SSH token');
      return undefined;
    }

    sshAPI
      .getConfig(token)
      .then((res: any) => {
        if (!res.success) {
          setStatus('error');
          setErrorMsg(res.error || 'Invalid token');
          return null;
        }
        setConfig(res.config);
        return res.config;
      })
      .catch(() => {
        setStatus('error');
        setErrorMsg('Failed to retrieve SSH config');
      });

    return undefined;
  }, [token]);

  useEffect(() => {
    if (!config || !terminalRef.current) return undefined;

    const { sshAPI } = window as any;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: '#0d1117',
        foreground: '#e6edf3',
        cursor: '#58a6ff',
        cursorAccent: '#0d1117',
        selectionBackground: 'rgba(88, 166, 255, 0.25)',
        black: '#0d1117',
        brightBlack: '#3b4047',
        red: '#ff7b72',
        brightRed: '#ffa198',
        green: '#3fb950',
        brightGreen: '#56d364',
        yellow: '#d29922',
        brightYellow: '#e3b341',
        blue: '#58a6ff',
        brightBlue: '#79c0ff',
        magenta: '#bc8cff',
        brightMagenta: '#d2a8ff',
        cyan: '#39c5cf',
        brightCyan: '#56d4dd',
        white: '#b1bac4',
        brightWhite: '#f0f6fc',
      },
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    termInstance.current = term;
    fitAddon.current = fit;

    term.open(terminalRef.current);
    fit.fit();

    const container = terminalRef.current;

    // Ctrl+C — copy selection when text is selected; otherwise SIGINT passes through
    // Ctrl+V — suppress xterm's keydown handling (paste comes via the paste event below)
    term.attachCustomKeyEventHandler((e: KeyboardEvent) => {
      if (e.type !== 'keydown') return true;
      if (e.ctrlKey && !e.shiftKey && e.code === 'KeyC') {
        const sel = term.getSelection();
        if (sel) {
          navigator.clipboard.writeText(sel);
          return false; // consumed — do not forward ^C to shell
        }
      }
      if (e.ctrlKey && !e.shiftKey && e.code === 'KeyV') {
        return false; // suppress xterm keydown; actual paste is handled by the paste event below
      }
      return true;
    });

    // Intercept paste events in capture phase (before xterm's textarea) to avoid double paste.
    // Works for both Ctrl+V and right-click → paste in OS context menus.
    const handlePaste = (ev: ClipboardEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      const text = ev.clipboardData?.getData('text/plain') ?? '';
      if (text && sessionIdRef.current) {
        sshAPI.sendInput(sessionIdRef.current, text);
      }
    };
    container.addEventListener('paste', handlePaste, true /* capture */);

    // Right-click → paste from clipboard (shows no context menu)
    const handleContextMenu = (ev: MouseEvent) => {
      ev.preventDefault();
      navigator.clipboard
        .readText()
        .then((text) => {
          if (text && sessionIdRef.current) {
            sshAPI.sendInput(sessionIdRef.current, text);
          }
          return text;
        })
        .catch(() => {});
    };
    container.addEventListener('contextmenu', handleContextMenu);

    term.writeln(
      `\x1b[2mConnecting to \x1b[0m\x1b[1;34m${config.host}\x1b[0m\x1b[2m…\x1b[0m`,
    );
    setStatus('connecting');

    let removeData: (() => void) | null = null;
    let removeClosed: (() => void) | null = null;

    const connect = async () => {
      try {
        const result = await sshAPI.connect({
          host: config.host,
          user: config.user,
          password: config.password,
          port: config.port,
        });

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

        removeData = sshAPI.onData((sid: string, data: string) => {
          if (sid === result.sessionId) term.write(data);
        });

        removeClosed = sshAPI.onClosed((sid: string) => {
          if (sid === result.sessionId) {
            term.writeln('\r\n\x1b[33mConnection closed.\x1b[0m');
            setStatus('closed');
            sessionIdRef.current = null;
          }
        });

        term.onData((data) => {
          if (sessionIdRef.current) {
            sshAPI.sendInput(sessionIdRef.current, data);
          }
        });

        term.onResize(({ cols, rows }) => {
          if (sessionIdRef.current) {
            sshAPI.resize(sessionIdRef.current, cols, rows);
          }
        });

        fit.fit();
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message);
        term.writeln(`\r\n\x1b[31mError: ${err.message}\x1b[0m`);
      }
    };

    connect();

    const handleResize = () => {
      if (fitAddon.current) fitAddon.current.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('paste', handlePaste, true);
      container.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('resize', handleResize);
      if (removeData) removeData();
      if (removeClosed) removeClosed();
      if (sessionIdRef.current && sshAPI) {
        sshAPI.disconnect(sessionIdRef.current);
        sessionIdRef.current = null;
      }
      term.dispose();
      termInstance.current = null;
      fitAddon.current = null;
    };
  }, [config]);

  const statusDot: Record<string, string> = {
    loading: 'var(--primary-blue)',
    connecting: 'var(--primary-blue)',
    connected: '#3fb950',
    error: '#ff7b72',
    closed: '#d29922',
  };

  const statusLabel: Record<string, string> = {
    loading: 'Loading…',
    connecting: 'Connecting…',
    connected: 'Connected',
    error: `Error: ${errorMsg}`,
    closed: 'Disconnected',
  };

  const handleClose = () => {
    const { sshAPI } = window as any;
    if (sessionIdRef.current && sshAPI) {
      sshAPI.disconnect(sessionIdRef.current);
      sessionIdRef.current = null;
    }
    sshAPI?.closeWindow();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#0d1117',
        overflow: 'hidden',
      }}
    >
      {/* Custom title bar — draggable, matches app AppBar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: '56px',
          px: '10px',
          gap: 1,
          background: 'rgba(2, 22, 36, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          flexShrink: 0,
          WebkitAppRegion: 'drag',
          userSelect: 'none',
        }}
      >
        {/* Icon */}
        <TerminalIcon
          sx={{
            color: 'var(--primary-blue)',
            fontSize: 20,
            WebkitAppRegion: 'no-drag',
            flexShrink: 0,
          }}
        />

        {/* Title */}
        <Typography
          variant="body2"
          sx={{
            color: 'var(--text-heading)',
            fontWeight: 600,
            letterSpacing: '0.02em',
            flexShrink: 0,
          }}
        >
          {config ? `${config.title}` : 'SSH Terminal'}
        </Typography>

        {config && (
          <Typography
            variant="caption"
            sx={{ color: 'var(--text-secondary)', flexShrink: 0 }}
          >
            {config.user}@{config.host}
            {config.port && config.port !== 22 ? `:${config.port}` : ''}
          </Typography>
        )}

        {/* Draggable spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Status badge */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            mr: 1,
            WebkitAppRegion: 'no-drag',
          }}
        >
          {status === 'connecting' || status === 'loading' ? (
            <CircularProgress size={12} sx={{ color: statusDot[status] }} />
          ) : (
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: statusDot[status],
                boxShadow: `0 0 6px ${statusDot[status]}`,
              }}
            />
          )}
          <Typography variant="caption" sx={{ color: statusDot[status] }}>
            {statusLabel[status] || status}
          </Typography>
        </Box>

        {/* Close button */}
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{
            WebkitAppRegion: 'no-drag',
            color: 'var(--text-secondary)',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(231, 76, 60, 0.18)',
              color: '#ff7b72',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Terminal area */}
      <Box
        ref={terminalRef}
        sx={{
          flex: 1,
          overflow: 'hidden',
          backgroundColor: '#0d1117',
          '& .xterm': {
            height: '100%',
            padding: '8px',
            backgroundColor: '#0d1117',
          },
          '& .xterm-viewport': {
            overflow: 'hidden !important',
            backgroundColor: '#0d1117 !important',
          },
          '& .xterm-screen': { height: '100%' },
        }}
      />
    </Box>
  );
}
