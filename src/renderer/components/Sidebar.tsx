import React, { useState, useEffect } from 'react';
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
import { fileSystemService } from '../services/fileSystemService';
import { FileSystemItem } from '../types/filesystem';

export default function Sidebar() {
  const { t } = useTranslation();
  const [value, setValue] = useState<number>(0);
  const [directoryItems, setDirectoryItems] = useState<FileSystemItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const loadDirectory = async (path?: string) => {
    if (!window.electron?.filesystem) {
      setDirectoryItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const targetPath = path || fileSystemService.getDefaultNotesDirectory();
      setCurrentPath(targetPath);

      // Try to create default directory if it doesn't exist
      if (!path) {
        await fileSystemService.createDirectory(targetPath);
      }

      const items = await fileSystemService.readDirectory(targetPath, {
        includeHidden: false,
        extensions: ['.md', '.txt', '.json'], // Common note formats
      });

      setDirectoryItems(items);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load directory:', error);
      // Fallback to empty array if directory doesn't exist or can't be read
      setDirectoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!currentPath) return;

    // eslint-disable-next-line no-alert
    const folderName = prompt(
      t('sidebar.prompts.folderName') || 'Enter folder name:',
    );
    if (folderName) {
      const newPath = `${currentPath}/${folderName}`;
      const success = await fileSystemService.createDirectory(newPath);
      if (success) {
        await loadDirectory(currentPath); // Refresh the tree
      }
    }
  };

  const handleCreateFile = async () => {
    if (!currentPath) return;

    // eslint-disable-next-line no-alert
    const fileName = prompt(
      t('sidebar.prompts.fileName') || 'Enter file name (with extension):',
    );
    if (fileName) {
      const newPath = `${currentPath}/${fileName}`;
      const success = await fileSystemService.createFile(newPath, '');
      if (success) {
        await loadDirectory(currentPath); // Refresh the tree
      }
    }
  };

  const renderTreeItems = (items: FileSystemItem[]): React.ReactNode => {
    return items.map((item) => (
      <TreeItem key={item.id} itemId={item.id} label={item.name}>
        {item.children && renderTreeItems(item.children)}
      </TreeItem>
    ));
  };

  const renderTreeContent = () => {
    if (loading) {
      return (
        <TreeItem
          itemId="loading"
          label={t('sidebar.tree.loading') || 'Loading...'}
        />
      );
    }

    if (directoryItems.length > 0) {
      return renderTreeItems(directoryItems);
    }

    return (
      <TreeItem
        itemId="empty"
        label={t('sidebar.tree.empty') || 'No files found'}
      />
    );
  };

  // Load default directory on component mount
  useEffect(() => {
    loadDirectory();
  }, []);

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
                onClick={handleCreateFolder}
              >
                <CreateNewFolderIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                title={t('sidebar.actions.createFile') || 'Create file'}
                onClick={handleCreateFile}
              >
                <NoteAddIcon fontSize="small" />
              </IconButton>
            </div>
          </div>
          <div className="tree-container">
            <SimpleTreeView
              aria-label={t('sidebar.tree.aria') ?? 'notes tree'}
              multiSelect
              defaultExpandedItems={[]}
              defaultSelectedItems={[]}
              sx={{
                flex: 1,
                overflow: 'auto',
                '& .MuiTreeItem-content': {
                  borderRadius: '4px',
                },
              }}
            >
              {renderTreeContent()}
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
