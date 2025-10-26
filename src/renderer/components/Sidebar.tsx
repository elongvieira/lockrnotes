import React, { useState, useEffect, useCallback } from 'react';
import '../theme.css';
import './Sidebar.css';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import RefreshIcon from '@mui/icons-material/Refresh';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { useTranslation } from 'react-i18next';
import { fileSystemService } from '../services/fileSystemService';
import { fileCreationService } from '../services/fileCreationService';
import type { FileCreationData } from '../types/fileCreation';
import { joinPath } from '../utils/pathUtil';
import { FileSystemItem } from '../types/filesystem';
import FolderDialog from './FolderDialog';
import FileCreationDialog from './FileCreationDialog';
import RenameDialog from './RenameDialog';
import MoveDialog from './MoveDialog';
import ConfirmDialog from './ConfirmDialog';
import PasswordDialog from './PasswordDialog';
import { useAppContext } from '../contexts/AppContext';

export default function Sidebar() {
  const {
    setRefreshSidebar,
    showNotification,
    openFileInEditor,
    tabs,
    setTabs,
    activeTab,
    setActiveTab,
  } = useAppContext();
  const { t } = useTranslation();
  const [value, setValue] = useState<number>(0);
  const [directoryItems, setDirectoryItems] = useState<FileSystemItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState<boolean>(false);
  const [fileDialogOpen, setFileDialogOpen] = useState<boolean>(false);
  const [targetFolderPath, setTargetFolderPath] = useState<string>('');

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    item: FileSystemItem | null;
  } | null>(null);

  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState<boolean>(false);
  const [itemToRename, setItemToRename] = useState<FileSystemItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<FileSystemItem | null>(null);

  // Move dialog state
  const [moveDialogOpen, setMoveDialogOpen] = useState<boolean>(false);
  const [itemToMove, setItemToMove] = useState<FileSystemItem | null>(null);

  // Copy dialog state
  const [copyDialogOpen, setCopyDialogOpen] = useState<boolean>(false);
  const [itemToCopy, setItemToCopy] = useState<FileSystemItem | null>(null);

  // Password dialog state for manual encryption
  const [passwordDialogOpen, setPasswordDialogOpen] = useState<boolean>(false);
  const [pendingFileData, setPendingFileData] = useState<{
    absolutePath: string;
    item: FileSystemItem;
    rawContent: string;
    originalExtension: string;
  } | null>(null);
  const [passwordError, setPasswordError] = useState<string>('');

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
      // Use centralized joinPath helper to respect OS-specific separators
      const newPath = await joinPath(targetPath, folderName);
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

  // NOTE: Use fileSystemService.itemExists(dirPath, filename) instead of local helper

  const handleRefresh = useCallback(async () => {
    // Reload the current path (or default if unset)
    try {
      await loadDirectory(currentPath || undefined);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to refresh directory:', err);
    }
  }, [currentPath]);

  // Handle file click
  const handleFileClick = async (itemId: string) => {
    // Find the item in directoryItems
    const findItem = (
      items: FileSystemItem[],
      id: string,
    ): FileSystemItem | null => {
      // eslint-disable-next-line no-restricted-syntax
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findItem(item.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const item = findItem(directoryItems, itemId);
    if (!item || item.type === 'directory') return;

    // Ensure we have an absolute path - if path is relative, make it absolute
    const absolutePath = item.path;

    // Support plain and encrypted variants:
    // - plain: .txt, .json
    // - encrypted wrappers: .ltxt (encrypted text), .ljson (encrypted json), .lenc (generic)
    const isPlainTxt = item.path.toLowerCase().endsWith('.txt');
    const isPlainJson = item.path.toLowerCase().endsWith('.json');
    const isEncLtxt = item.path.toLowerCase().endsWith('.ltxt');
    const isEncLjson = item.path.toLowerCase().endsWith('.ljson');
    const isEncGeneric = item.path.toLowerCase().endsWith('.lenc');
    const isEncrypted = isEncLtxt || isEncLjson || isEncGeneric;

    if (!isPlainTxt && !isPlainJson && !isEncrypted) {
      showNotification(
        'Only .txt, .json and encrypted (.ltxt, .ljson, .lenc) files are supported',
        'warning',
      );
      return;
    }

    try {
      // Load file content using absolute path
      const rawContent = await fileSystemService.readFile(absolutePath);
      if (rawContent === null) {
        showNotification('Failed to read file', 'error');
        return;
      }

      let content = rawContent;
      let originalExtension = item.extension;
      // If the filename indicates the encrypted wrapper, set a sensible default
      // for the original extension so the editor chooses the correct view before decrypting.
      if (isEncLtxt) {
        originalExtension = '.txt';
      }
      if (isEncLjson) {
        originalExtension = '.json';
      }
      let isFileEncrypted = false;

      // If file is encrypted, decrypt it
      if (isEncrypted) {
        try {
          // Check if it's managed encryption
          const looksEncrypted =
            await window.encryptionAPI.isContentEncrypted(rawContent);

          if (looksEncrypted) {
            // Managed encryption
            const encryptedData = JSON.parse(rawContent);
            const decrypted = await window.encryptionAPI.decryptContent(
              encryptedData,
              absolutePath,
            );

            content = decrypted;
            isFileEncrypted = true;

            if (encryptedData && encryptedData.originalExtension) {
              originalExtension = encryptedData.originalExtension;
            }
          }

          // Check if it's manual encryption
          const isManuallyEncrypted =
            await window.manualEncryptionAPI.isManuallyEncrypted(rawContent);

          if (isManuallyEncrypted) {
            // Manual encryption - need password
            setPendingFileData({
              absolutePath,
              item,
              rawContent,
              originalExtension: originalExtension || '.txt',
            });
            setPasswordError('');
            setPasswordDialogOpen(true);
            return; // Wait for password input
          }

          if (!looksEncrypted && !isManuallyEncrypted) {
            showNotification(
              'File is marked encrypted but payload is invalid',
              'error',
            );
            return;
          }
        } catch (decryptError: any) {
          const msg =
            (decryptError && decryptError.message) || String(decryptError);
          showNotification(`Failed to decrypt file: ${msg}`, 'error');
          return;
        }
      }

      // Open in editor
      openFileInEditor(
        absolutePath,
        item.name,
        originalExtension,
        content,
        isFileEncrypted,
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error opening file:', error);
      showNotification('Error opening file', 'error');
    }
  };

  // Handle password confirmation for manually encrypted files
  const handlePasswordConfirm = async (password: string) => {
    if (!pendingFileData) return;

    try {
      const encryptedData = JSON.parse(pendingFileData.rawContent);
      const result = await window.manualEncryptionAPI.decryptContent(
        encryptedData,
        password,
      );

      if (!result.success) {
        setPasswordError(
          t('dialog.password.wrongPassword') ||
            'Wrong password. Please try again.',
        );
        return; // Keep dialog open for retry
      }

      // Success! Close dialog and open file
      setPasswordDialogOpen(false);
      setPendingFileData(null);
      setPasswordError('');

      // Get original extension from encrypted data
      const originalExt =
        (await window.manualEncryptionAPI.getOriginalExtension(
          pendingFileData.rawContent,
        )) || pendingFileData.originalExtension;

      // Open in editor
      openFileInEditor(
        pendingFileData.absolutePath,
        pendingFileData.item.name,
        originalExt,
        result.data || '',
        true, // isEncrypted
        password, // Pass the password to be stored encrypted in memory
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error decrypting with password:', error);
      setPasswordError(
        t('dialog.password.wrongPassword') ||
          'Wrong password. Please try again.',
      );
    }
  };

  const handlePasswordDialogClose = () => {
    setPasswordDialogOpen(false);
    setPendingFileData(null);
    setPasswordError('');
  };

  // Handle context menu (right-click)
  const handleContextMenu = (event: React.MouseEvent, item: FileSystemItem) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      item,
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleContextMenuOpen = () => {
    if (contextMenu?.item) {
      handleFileClick(contextMenu.item.id);
    }
    handleContextMenuClose();
  };

  const handleContextMenuRename = () => {
    if (contextMenu?.item) {
      setItemToRename(contextMenu.item);
      setRenameDialogOpen(true);
    }
    handleContextMenuClose();
  };

  const handleContextMenuDelete = () => {
    if (contextMenu?.item) {
      setItemToDelete(contextMenu.item);
      setDeleteConfirmOpen(true);
    }
    handleContextMenuClose();
  };

  const handleContextMenuMove = () => {
    if (contextMenu?.item) {
      setItemToMove(contextMenu.item);
      setMoveDialogOpen(true);
    }
    handleContextMenuClose();
  };

  const handleContextMenuCopy = () => {
    if (contextMenu?.item) {
      setItemToCopy(contextMenu.item);
      setCopyDialogOpen(true);
    }
    handleContextMenuClose();
  };

  const handleRenameDialogClose = () => {
    setRenameDialogOpen(false);
    setItemToRename(null);
  };

  const handleRenameDialogConfirm = async (newName: string) => {
    if (!itemToRename) return { success: false };

    const oldPath = itemToRename.path;
    const openTab = tabs.find((tab) => tab.filePath === oldPath);

    try {
      // compute new path
      const lastSep = Math.max(
        oldPath.lastIndexOf('/'),
        oldPath.lastIndexOf('\\'),
      );
      const parentDir = oldPath.substring(0, lastSep);
      // check if target already exists (check by dir + filename to avoid confusion)
      const exists = await fileSystemService.itemExists(parentDir, newName);
      // compute newPath after confirming existence
      const newPath = await joinPath(parentDir, newName);
      if (exists) {
        return {
          success: false,
          message:
            t('dialog.rename.errors.fileExists') ||
            'A file with that name already exists',
        };
      }

      // If file is open, save current content first
      let contentToReopen = '';
      if (openTab) {
        const saved = await fileSystemService.saveFileWithEncryption(
          oldPath,
          openTab.content,
          openTab.isEncrypted,
          openTab.originalExtension,
        );
        if (!saved) {
          showNotification(
            t('notifications.fileSaveError') || 'Failed to save file',
            'error',
          );
          return { success: false };
        }
        contentToReopen = openTab.content;
        // close the tab
        setTabs((prev) => prev.filter((tab) => tab.filePath !== oldPath));
      }

      // Perform rename
      const success = await fileSystemService.renameItem(oldPath, newPath);

      if (success) {
        // refresh tree
        await loadDirectory(currentPath);

        // reopen in editor if was open
        if (openTab) {
          openFileInEditor(
            newPath,
            newName,
            itemToRename.extension,
            contentToReopen,
            itemToRename.extension?.startsWith('.l') ?? false,
          );
        }

        showNotification(t('notifications.fileRenamed'), 'success');
        return { success: true };
      }

      showNotification(t('notifications.fileRenameError'), 'error');
      return { success: false };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error renaming item:', error);
      showNotification(t('notifications.fileRenameError'), 'error');
      return { success: false };
    }
  };

  const handleDeleteConfirmCancel = () => {
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleDeleteConfirmProceed = async () => {
    if (!itemToDelete) return;

    const { path } = itemToDelete;
    try {
      // If open in tab, close it
      const openTab = tabs.find((tab) => tab.filePath === path);
      if (openTab) {
        setTabs((prev) => prev.filter((tab) => tab.filePath !== path));
        // If the deleted file was the activeTab, clear the activeTab.
        // setActiveTab expects a string argument, so set to empty string to clear selection.
        if (typeof setActiveTab === 'function' && openTab.id) {
          if (activeTab === openTab.id) {
            setActiveTab('');
          }
        }
      }

      const success = await fileSystemService.deleteItem(path);
      if (success) {
        await loadDirectory(currentPath);
        showNotification(t('notifications.fileDeleted'), 'success');
      } else {
        showNotification(t('notifications.fileDeleteError'), 'error');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error deleting item:', err);
      showNotification(t('notifications.fileDeleteError'), 'error');
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const handleMoveDialogClose = () => {
    setMoveDialogOpen(false);
    setItemToMove(null);
  };

  const handleMoveDialogConfirm = async (destinationPath: string) => {
    if (!itemToMove) return { success: false };

    const oldPath = itemToMove.path;
    const itemName = itemToMove.name;
    const openTab = tabs.find((tab) => tab.filePath === oldPath);

    try {
      // Compute new path
      const newPath = await joinPath(destinationPath, itemName);

      // Check if target already exists
      const exists = await fileSystemService.itemExists(
        destinationPath,
        itemName,
      );
      if (exists) {
        return {
          success: false,
          message:
            t('dialog.move.errors.fileExists') ||
            'An item with that name already exists in the destination',
        };
      }

      // If file is open, save current content first (handle encrypted case)
      let contentToReopen = '';
      if (openTab) {
        const saved = await fileSystemService.saveFileWithEncryption(
          oldPath,
          openTab.content,
          openTab.isEncrypted,
          openTab.originalExtension,
        );
        if (!saved) {
          showNotification(
            t('notifications.fileSaveError') || 'Failed to save file',
            'error',
          );
          return { success: false };
        }

        contentToReopen = openTab.content;
        // Close the tab
        setTabs((prev) => prev.filter((tab) => tab.filePath !== oldPath));
      }

      // Perform move (using renameItem which handles both rename and move)
      const success = await fileSystemService.renameItem(oldPath, newPath);

      if (success) {
        // Refresh tree
        await loadDirectory(currentPath);

        // Reopen in editor if was open
        if (openTab) {
          openFileInEditor(
            newPath,
            itemName,
            itemToMove.extension,
            contentToReopen,
            itemToMove.extension?.startsWith('.l') ?? false,
          );
        }

        showNotification(
          t('notifications.fileMoved') || 'Item moved successfully',
          'success',
        );
        return { success: true };
      }

      showNotification(
        t('notifications.fileMoveError') || 'Failed to move item',
        'error',
      );
      return { success: false };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error moving item:', error);
      showNotification(
        t('notifications.fileMoveError') || 'Failed to move item',
        'error',
      );
      return { success: false };
    }
  };

  const handleCopyDialogOpen = async () => {
    if (!itemToCopy) return;

    try {
      // Open folder picker starting at default notes directory
      const defaultNotesDir =
        await fileSystemService.getDefaultNotesDirectory();
      const selectedPath = await (window as any).electron.window.selectFolder(
        defaultNotesDir,
      );

      if (!selectedPath) return; // user cancelled

      const sourcePath = itemToCopy.path;
      const itemName = itemToCopy.name;
      const destPath = await joinPath(selectedPath, itemName);

      // Check if target already exists
      const exists = await fileSystemService.itemExists(selectedPath, itemName);
      if (exists) {
        showNotification(
          t('dialog.move.errors.fileExists') ||
            'An item with that name already exists in the destination',
          'error',
        );
        setCopyDialogOpen(false);
        setItemToCopy(null);
        return;
      }

      // If copying a file, read content and write to new location
      // If copying a folder, we'll just copy the folder recursively (simplified)
      let success = false;
      if (itemToCopy.type === 'file') {
        const content = await fileSystemService.readFile(sourcePath);
        if (content !== null) {
          success = await fileSystemService.createFile(destPath, content);
        }
      } else {
        // For folders, you would need a folder copy operation
        // For now, show a message
        showNotification(
          t('notifications.copyFolderNotSupported') ||
            'Folder copy not yet supported',
          'warning',
        );
        setCopyDialogOpen(false);
        setItemToCopy(null);
        return;
      }

      if (success) {
        await loadDirectory(currentPath);
        showNotification(
          t('notifications.fileCopied') || 'Item copied successfully',
          'success',
        );
      } else {
        showNotification(
          t('notifications.fileCopyError') || 'Failed to copy item',
          'error',
        );
      }

      setCopyDialogOpen(false);
      setItemToCopy(null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error copying item:', error);
      showNotification(
        t('notifications.fileCopyError') || 'Failed to copy item',
        'error',
      );
      setCopyDialogOpen(false);
      setItemToCopy(null);
    }
  };

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
              onContextMenu={(e) => handleContextMenu(e, item)}
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
              onItemClick={(event, itemId) => {
                handleFileClick(itemId);
              }}
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

      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        slotProps={{
          paper: {
            className: 'app-menu-paper',
          },
        }}
      >
        <MenuItem onClick={handleContextMenuOpen} className="app-menu-item">
          <ListItemIcon className="app-menu-icon">
            <OpenInNewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('contextMenu.open')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleContextMenuRename} className="app-menu-item">
          <ListItemIcon className="app-menu-icon">
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('contextMenu.rename')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleContextMenuMove} className="app-menu-item">
          <ListItemIcon className="app-menu-icon">
            <DriveFileMoveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('contextMenu.move')}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleContextMenuCopy();
            handleCopyDialogOpen();
          }}
          className="app-menu-item"
        >
          <ListItemIcon className="app-menu-icon">
            <FileCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('contextMenu.copy')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleContextMenuDelete} className="app-menu-item">
          <ListItemIcon className="app-menu-icon">
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('contextMenu.delete')}</ListItemText>
        </MenuItem>
      </Menu>

      <RenameDialog
        open={renameDialogOpen}
        onClose={handleRenameDialogClose}
        onConfirm={handleRenameDialogConfirm}
        currentName={itemToRename?.name || ''}
        itemType={itemToRename?.type === 'directory' ? 'folder' : 'file'}
        isFileOpen={
          itemToRename
            ? tabs.some((tab) => tab.filePath === itemToRename.path)
            : false
        }
      />

      <MoveDialog
        open={moveDialogOpen}
        onClose={handleMoveDialogClose}
        onConfirm={handleMoveDialogConfirm}
        currentPath={
          itemToMove
            ? itemToMove.path.substring(
                0,
                Math.max(
                  itemToMove.path.lastIndexOf('/'),
                  itemToMove.path.lastIndexOf('\\'),
                ),
              )
            : ''
        }
        itemName={itemToMove?.name || ''}
        itemType={itemToMove?.type === 'directory' ? 'folder' : 'file'}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('dialog.delete.title')}
        message={t('dialog.delete.message')}
        confirmLabel={t('dialog.actions.delete')}
        cancelLabel={t('dialog.actions.cancel')}
        onConfirm={handleDeleteConfirmProceed}
        onClose={handleDeleteConfirmCancel}
      />

      <PasswordDialog
        open={passwordDialogOpen}
        onClose={handlePasswordDialogClose}
        onConfirm={handlePasswordConfirm}
        filename={pendingFileData?.item.name}
        error={passwordError}
      />
    </aside>
  );
}
