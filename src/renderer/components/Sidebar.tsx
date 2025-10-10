import React, { useState } from 'react';
import '../theme.css';
import './Sidebar.css';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { useTranslation } from 'react-i18next';

export default function Sidebar() {
  const { t } = useTranslation();
  const [value, setValue] = useState<number>(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <aside className="sidebar">
      <div className="tabs-area">
        <Box sx={{ width: '100%' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label={t('sidebar.tabs.aria') ?? 'Sidebar Tabs'}
            variant="fullWidth"
          >
            <Tab
              label={t('sidebar.tabs.local')}
              id="tab-local"
              aria-controls="tabpanel-local"
            />
            <Tab
              label={t('sidebar.tabs.remote')}
              id="tab-remote"
              aria-controls="tabpanel-remote"
              disabled
            />
          </Tabs>
        </Box>
      </div>

      <div
        role="tabpanel"
        hidden={value !== 0}
        id="tabpanel-local"
        aria-labelledby="tab-local"
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <div className="files-card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <h4>{t('sidebar.tabs.files')}</h4>
            <div className="header-actions">
              <IconButton
                size="small"
                title={t('sidebar.actions.createFolder') || 'Create folder'}
              >
                <CreateNewFolderIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                title={t('sidebar.actions.createFile') || 'Create file'}
              >
                <NoteAddIcon fontSize="small" />
              </IconButton>
            </div>
          </div>
          <div className="tree-container">
            <SimpleTreeView
              aria-label={t('sidebar.tree.aria') ?? 'notes tree'}
              sx={{
                flex: 1,
                overflow: 'auto',
                '& .MuiTreeItem-content': {
                  borderRadius: '4px',
                },
              }}
            >
              <TreeItem itemId="1" label={t('sidebar.tree.root') || 'Notes'}>
                <TreeItem itemId="2" label="Personal" />
                <TreeItem itemId="3" label="Work" />
                <TreeItem itemId="4" label="Ideas" />
              </TreeItem>
            </SimpleTreeView>
          </div>
        </div>
      </div>

      <div
        role="tabpanel"
        hidden={value !== 1}
        id="tabpanel-remote"
        aria-labelledby="tab-remote"
      >
        {/* Remote tab content (disabled) */}
      </div>
    </aside>
  );
}
