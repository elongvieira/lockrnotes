import React, { useState, useEffect, useCallback } from 'react';
import '../theme.css';
import './Sidebar.css';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import RefreshIcon from '@mui/icons-material/Refresh';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { useTranslation } from 'react-i18next';
import { fileSystemService } from '../services/fileSystemService';
import {
  fileCreationService,
  FileCreationData,
} from '../services/fileCreationService';
import { FileSystemItem } from '../types/filesystem';
import FolderDialog from './FolderDialog';
import FileCreationDialog from './FileCreationDialog';
import { useAppContext } from '../contexts/AppContext';

export default function Sidebar() {
  const { setRefreshSidebar, showNotification } = useAppContext();
  const { t } = useTranslation();
  const [value, setValue] = useState<number>(0);
  const [directoryItems, setDirectoryItems] = useState<FileSystemItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState<boolean>(false);
  const [fileDialogOpen, setFileDialogOpen] = useState<boolean>(false);
  const [targetFolderPath, setTargetFolderPath] = useState<string>('');

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
      let targetPath: string;
      if (path && path.length > 0) {
        targetPath = path;
      } else {
        // getDefaultNotesDirectory is async now
        targetPath = await fileSystemService.getDefaultNotesDirectory();
      }
      setCurrentPath(targetPath);

      // Try to create default directory if it doesn't exist
      if (!path) {
        await fileSystemService.createDirectory(targetPath);
      }

      const items = await fileSystemService.readDirectory(targetPath, {
        includeHidden: false,
        extensions: ['.md', '.txt', '.json', '.ltxt', '.ljson', '.lenc'], // Common note formats + encrypted
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

  const handleCreateFolder = () => {
    setFolderDialogOpen(true);
  };

  const handleFolderDialogClose = () => {
    setFolderDialogOpen(false);
  };

  const handleFolderDialogConfirm = async (folderName: string) => {
    const targetPath = targetFolderPath || currentPath;
    if (!targetPath) return;

    try {
      const newPath = `${targetPath}/${folderName}`;
      const success = await fileSystemService.createDirectory(newPath);
      if (success) {
        await loadDirectory(currentPath); // Refresh the tree
        showNotification(t('notifications.folderCreated'), 'success');
      } else {
        showNotification(t('notifications.folderCreationError'), 'error');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating folder:', error);
      showNotification(t('notifications.folderCreationError'), 'error');
    }
    setTargetFolderPath(''); // Clear the target path
  };

  const handleCreateFile = () => {
    setTargetFolderPath(''); // Create in root by default
    setFileDialogOpen(true);
  };

  const handleCreateFolderInPath = (folderPath: string) => {
    setTargetFolderPath(folderPath);
    setFolderDialogOpen(true);
  };

  const handleCreateFileInPath = (folderPath: string) => {
    setTargetFolderPath(folderPath);
    setFileDialogOpen(true);
  };

  const handleFileDialogClose = () => {
    setFileDialogOpen(false);
  };

  const handleFileDialogConfirm = async (fileData: FileCreationData) => {
    const targetPath = targetFolderPath || currentPath;
    if (!targetPath) return;

    try {
      const success = await fileCreationService.createFile(
        targetPath,
        fileData,
      );
      if (success) {
        await loadDirectory(currentPath); // Refresh the tree
        showNotification(t('notifications.fileCreated'), 'success');
      } else {
        showNotification(t('notifications.fileCreationError'), 'error');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating file:', error);
      showNotification(t('notifications.fileCreationError'), 'error');
    }

    setTargetFolderPath(''); // Clear the target path
  };

  const handleRefresh = useCallback(async () => {
    // Reload the current path (or default if unset)
    try {
      await loadDirectory(currentPath || undefined);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to refresh directory:', err);
    }
  }, [currentPath]);

  const renderTreeItems = (
    items: FileSystemItem[],
    depth = 0,
  ): React.ReactNode => {
    return items.map((item) => {
      const isDirectory = item.type === 'directory';
      const icon = isDirectory ? (
        <FolderIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
      ) : (
        <InsertDriveFileIcon
          sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }}
        />
      );

      return (
        <TreeItem
          key={item.id}
          itemId={item.id}
          label={
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                paddingLeft: `${depth * 10}px`,
                width: '100%',
                '&:hover .folder-actions': {
                  opacity: 1,
                },
              }}
            >
              {icon}
              <Box sx={{ flexGrow: 1 }}>{item.name}</Box>
              {isDirectory && (
                <Box
                  className="folder-actions"
                  sx={{
                    opacity: 0.6,
                    transition: 'opacity 0.2s',
                    display: 'flex',
                    gap: 0.5,
                    mr: 1,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateFolderInPath(item.path);
                    }}
                    sx={{
                      padding: '2px',
                      color: '#4da6ff',
                      '&:hover': {
                        backgroundColor: 'rgba(77, 166, 255, 0.1)',
                        color: '#3399ff',
                      },
                    }}
                    title={t('sidebar.actions.createFolder') || 'Create folder'}
                  >
                    <CreateNewFolderIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateFileInPath(item.path);
                    }}
                    sx={{
                      padding: '2px',
                      color: '#4da6ff',
                      '&:hover': {
                        backgroundColor: 'rgba(77, 166, 255, 0.1)',
                        color: '#3399ff',
                      },
                    }}
                    title={t('sidebar.actions.createFile') || 'Create file'}
                  >
                    <NoteAddIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              )}
            </Box>
          }
          sx={{
            '& .MuiTreeItem-content': {
              paddingLeft: '0px !important',
            },
          }}
        >
          {item.children && renderTreeItems(item.children, depth + 1)}
        </TreeItem>
      );
    });
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
    const initializeDirectory = async () => {
      try {
        const notesPath = await fileSystemService.getDefaultNotesDirectory();

        // Ensure the notes directory exists
        await fileSystemService.createDirectory(notesPath);

        // Load the notes directory
        loadDirectory(notesPath);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load default directory:', error);
        loadDirectory();
      }
    };

    initializeDirectory();
  }, []);

  // Registrar função de refresh no context
  useEffect(() => {
    setRefreshSidebar(() => handleRefresh);
  }, [handleRefresh, setRefreshSidebar]);

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
          <div className="files-card-header">
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
              <IconButton
                size="small"
                title={t('sidebar.actions.refresh') || 'Refresh'}
                onClick={handleRefresh}
              >
                <RefreshIcon fontSize="small" />
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

      <FolderDialog
        open={folderDialogOpen}
        onClose={handleFolderDialogClose}
        onConfirm={handleFolderDialogConfirm}
      />

      <FileCreationDialog
        open={fileDialogOpen}
        onClose={handleFileDialogClose}
        onConfirm={handleFileDialogConfirm}
      />
    </aside>
  );
}
