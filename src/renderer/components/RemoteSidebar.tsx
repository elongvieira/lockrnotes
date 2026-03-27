import React, { useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudIcon from '@mui/icons-material/Cloud';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../contexts/AppContext';
import CommunityLoginDialog from './CommunityLoginDialog';
import { dialogStyles } from '../styles/dialogStyles';

export default function RemoteSidebar() {
  const { t } = useTranslation();
  const { communitySession, setCommunitySession } = useAppContext();
  const [loginOpen, setLoginOpen] = useState(false);
  const [loading] = useState(false);

  const handleLoginSuccess = (session: {
    host: string;
    port: number;
    email: string;
  }) => {
    setCommunitySession(session);
    setLoginOpen(false);
  };

  // Not connected — show prompt
  if (!communitySession) {
    return (
      <>
        <Box
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            mt: 2,
          }}
        >
          <CloudIcon sx={{ fontSize: 56, color: 'var(--primary-blue)' }} />
          <Typography
            variant="body2"
            sx={{ color: 'var(--text-secondary)', textAlign: 'center' }}
          >
            {t('community.notConnected') ||
              'Connect to a community server to access shared notes.'}
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={() => setLoginOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            {t('community.loginButton') || 'Connect'}
          </Button>
        </Box>

        <CommunityLoginDialog
          open={loginOpen}
          onClose={() => setLoginOpen(false)}
          onSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  // Connected — mirror local layout with placeholder tree
  return (
    <div className="files-card">
      <div className="files-card-header">
        <h4>{t('sidebar.tabs.files')}</h4>
        <div className="header-actions">
          <IconButton
            size="small"
            title={t('sidebar.actions.refresh') || 'Refresh'}
            disabled={loading}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </div>
      </div>
      <div className="tree-container">
        <SimpleTreeView
          aria-label={t('sidebar.tree.aria') ?? 'remote notes tree'}
          sx={{
            flex: 1,
            overflow: 'auto',
            ...dialogStyles.scrollbar,
          }}
        >
          <TreeItem
            itemId="remote-empty"
            label={t('sidebar.tree.loading') || 'Loading...'}
          />
        </SimpleTreeView>
      </div>
    </div>
  );
}
