/* eslint-disable no-nested-ternary, no-use-before-define, @typescript-eslint/no-shadow */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudIcon from '@mui/icons-material/Cloud';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../contexts/AppContext';
import CommunityLoginDialog from './CommunityLoginDialog';
import { fileCreationService } from '../services/fileCreationService';
import { fileSystemService } from '../services/fileSystemService';
import type { FileCreationData } from '../types/fileCreation';
import { FileSystemItem } from '../types/filesystem';
import FolderDialog from './FolderDialog';
import FileCreationDialog from './FileCreationDialog';
import RenameDialog from './RenameDialog';
import ConfirmDialog from './ConfirmDialog';
import PasswordDialog from './PasswordDialog';
import TreeItemLabel from './TreeItemLabel';
import { dialogStyles } from '../styles/dialogStyles';

interface RemoteFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  content: string | null;
  groupId: string | null;
  ownerId: string;
  childrenCount: number;
}

interface RemoteFileSystemItem extends FileSystemItem {
  childrenCount?: number;
}

export default function RemoteSidebar() {
  const { t } = useTranslation();
  const {
    communitySession,
    setCommunitySession,
    showNotification,
    openFileInEditor,
    tabs,
    setTabs,
    setActiveTab,
  } = useAppContext();

  const [loginOpen, setLoginOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<RemoteFile[]>([]);
  const [treeData, setTreeData] = useState<RemoteFileSystemItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<string[]>([
    'meus-arquivos',
  ]);
  const expandedItemsRef = useRef<string[]>(['meus-arquivos']);

  useEffect(() => {
    expandedItemsRef.current = expandedItems;
  }, [expandedItems]);

  // Dialogs
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState<string | undefined>(
    undefined,
  );

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<FileSystemItem | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FileSystemItem | null>(null);

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [pendingFileData, setPendingFileData] = useState<{
    absolutePath: string;
    item: FileSystemItem;
    rawContent: string;
    originalExtension: string;
  } | null>(null);
  const [passwordError, setPasswordError] = useState('');

  // Context Menu
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    item: FileSystemItem | null;
  } | null>(null);

  const handleLoginSuccess = (session: {
    host: string;
    port: number;
    email: string;
    isAdmin: boolean;
  }) => {
    setCommunitySession(session);
    setLoginOpen(false);
  };

  const loadFiles = useCallback(
    async (preserveExpanded = false) => {
      if (!communitySession) return;
      setLoading(true);
      try {
        const result = await window.communityFilesAPI.getFiles();
        if (result.success && result.data) {
          let newFiles = result.data;
          if (preserveExpanded) {
            const promises = expandedItemsRef.current
              .filter(
                (id) =>
                  id !== 'meus-arquivos' && !String(id).startsWith('loading'),
              )
              .map((id) => window.communityFilesAPI.getFiles(id));

            const results = await Promise.all(promises);
            for (const res of results) {
              if (res.success && res.data) {
                newFiles = [...newFiles, ...res.data];
              }
            }
            setFiles(newFiles);
          } else {
            setFiles(result.data);
            setExpandedItems(['meus-arquivos']);
          }
        } else {
          showNotification('Failed to load remote files', 'error');
        }
      } catch (err) {
        console.error(err);
        showNotification('Error loading remote files', 'error');
      } finally {
        setLoading(false);
      }
    },
    [communitySession, showNotification],
  );

  // Build tree data whenever files change
  useEffect(() => {
    const buildTree = (allFiles: RemoteFile[]) => {
      const itemMap = new Map<string, RemoteFileSystemItem>();

      // Init mapped objects
      allFiles.forEach((f) => {
        let extension = '';
        if (f.type === 'file') {
          const dotIdx = f.name.lastIndexOf('.');
          if (dotIdx >= 0) extension = f.name.substring(dotIdx);
        }
        itemMap.set(f.id, {
          id: f.id,
          name: f.name,
          path: `remote://${f.id}`,
          type: f.type === 'folder' ? 'directory' : 'file',
          extension,
          childrenCount: f.childrenCount,
          children:
            f.type === 'folder'
              ? f.childrenCount > 0
                ? []
                : undefined
              : undefined,
        });
      });

      const rootChildren: RemoteFileSystemItem[] = [];

      allFiles.forEach((f) => {
        const item = itemMap.get(f.id)!;
        if (f.parentId && itemMap.has(f.parentId)) {
          const parentItem = itemMap.get(f.parentId)!;
          if (!parentItem.children) parentItem.children = [];
          parentItem.children.push(item);
        } else if (!f.parentId) {
          rootChildren.push(item);
        }
      });

      const meusArquivos: RemoteFileSystemItem = {
        id: 'meus-arquivos',
        name: 'Meus Arquivos',
        path: 'remote://root',
        type: 'directory',
        children: rootChildren,
      };

      setTreeData([meusArquivos]);
    };

    buildTree(files);
  }, [files]);

  useEffect(() => {
    if (communitySession) {
      loadFiles(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communitySession]);

  const fetchFolderContents = async (folderId: string) => {
    if (files.some((f) => f.parentId === folderId)) return; // already fetched

    try {
      // getFiles already accepts a parentId to fetch folder contents
      const result = await window.communityFilesAPI.getFiles(folderId);
      if (result.success && result.data) {
        setFiles((prev) => {
          const newFiles = result.data.filter(
            (newFile: RemoteFile) => !prev.some((f) => f.id === newFile.id),
          );
          return [...prev, ...newFiles];
        });
      }
    } catch (err) {
      console.error('Failed to fetch folder contents', err);
    }
  };

  const handleExpandedItemsChange = async (
    _event: React.SyntheticEvent | null,
    itemIds: string[],
  ) => {
    setExpandedItems(itemIds);

    // Check if new folders were expanded
    for (const folderId of itemIds) {
      if (
        folderId === 'meus-arquivos' ||
        folderId === 'loading' ||
        folderId === 'empty'
      )
        continue;

      const item = files.find((f) => f.id === folderId);
      if (item && item.type === 'folder' && item.childrenCount > 0) {
        await fetchFolderContents(folderId);
      }
    }
  };

  const handleCreateFolder = () => {
    setTargetFolderId(undefined); // Root of Meus Arquivos
    setFolderDialogOpen(true);
  };

  const handleCreateFile = () => {
    setTargetFolderId(undefined); // Root of Meus Arquivos
    setFileDialogOpen(true);
  };

  const handleCreateFolderInPath = (itemId: string) => {
    setTargetFolderId(itemId === 'meus-arquivos' ? undefined : itemId);
    setFolderDialogOpen(true);
  };

  const handleCreateFileInPath = (itemId: string) => {
    setTargetFolderId(itemId === 'meus-arquivos' ? undefined : itemId);
    setFileDialogOpen(true);
  };

  const handleFolderDialogConfirm = async (folderName: string) => {
    try {
      const result = await window.communityFilesAPI.createFile({
        name: folderName,
        type: 'folder',
        parentId: targetFolderId,
      });
      if (result.success) {
        showNotification(t('notifications.folderCreated'), 'success');
        await loadFiles(true);
      } else {
        showNotification(
          t('notifications.folderCreationError') || 'Error creating folder',
          'error',
        );
      }
    } catch (err) {
      console.error(err);
      showNotification(
        t('notifications.folderCreationError') || 'Error creating folder',
        'error',
      );
    }
    setFolderDialogOpen(false);
  };

  const handleFileDialogConfirm = async (fileData: FileCreationData) => {
    fileData.parentId = targetFolderId;
    try {
      const result = await fileCreationService.createFile('remote', fileData);
      if (result.success) {
        showNotification(t('notifications.fileCreated'), 'success');
        await loadFiles(true);
      } else {
        showNotification(
          t('notifications.fileCreationError') || 'Error creating file',
          'error',
        );
      }
    } catch (error) {
      console.error('Error creating file:', error);
      showNotification(t('notifications.fileCreationError'), 'error');
    }
    setFileDialogOpen(false);
  };

  // ---------------- Context Menu ----------------
  const handleContextMenu = (event: React.MouseEvent, item: FileSystemItem) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      item,
    });
  };

  const handleContextMenuClose = () => setContextMenu(null);

  const handleContextMenuOpen = () => {
    if (contextMenu?.item) {
      if (contextMenu.item.type === 'file') {
        handleFileClick(contextMenu.item.id);
      }
    }
    handleContextMenuClose();
  };

  const handleContextMenuRename = () => {
    if (contextMenu?.item && contextMenu.item.id !== 'meus-arquivos') {
      setItemToRename(contextMenu.item);
      setRenameDialogOpen(true);
    }
    handleContextMenuClose();
  };

  const handleContextMenuDelete = () => {
    if (contextMenu?.item && contextMenu.item.id !== 'meus-arquivos') {
      setItemToDelete(contextMenu.item);
      setDeleteConfirmOpen(true);
    }
    handleContextMenuClose();
  };

  // ---------------- File Actions ----------------
  const handleFileClick = async (itemId: string) => {
    const findItem = (
      items: FileSystemItem[],
      id: string,
    ): FileSystemItem | null => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findItem(item.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const item = findItem(treeData, itemId);
    if (!item || item.type === 'directory') return;

    const absolutePath = item.path;

    try {
      const rawContent = await fileSystemService.readFile(absolutePath);
      if (rawContent === null) {
        showNotification('Failed to read file from server', 'error');
        return;
      }

      let content = rawContent;
      let originalExtension = item.extension;

      const isPlainTxt = item.name.toLowerCase().endsWith('.txt');
      const isPlainJson = item.name.toLowerCase().endsWith('.json');
      const isEncLtxt = item.name.toLowerCase().endsWith('.ltxt');
      const isEncLjson = item.name.toLowerCase().endsWith('.ljson');
      const isEncGeneric = item.name.toLowerCase().endsWith('.lenc');
      const isEncrypted = isEncLtxt || isEncLjson || isEncGeneric;

      if (!isPlainTxt && !isPlainJson && !isEncrypted) {
        showNotification('Only supported formats can be opened', 'warning');
        return;
      }

      if (isEncLtxt) originalExtension = '.txt';
      if (isEncLjson) originalExtension = '.json';
      let isFileEncrypted = false;

      if (isEncrypted) {
        try {
          const looksEncrypted =
            await window.encryptionAPI.isContentEncrypted(rawContent);

          if (looksEncrypted) {
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

          const isManuallyEncrypted =
            await window.manualEncryptionAPI.isManuallyEncrypted(rawContent);

          if (isManuallyEncrypted) {
            const existingTab = tabs.find(
              (tab) => tab.filePath === absolutePath,
            );
            if (existingTab) {
              setActiveTab(existingTab.id);
              return;
            }

            setPendingFileData({
              absolutePath,
              item,
              rawContent,
              originalExtension: originalExtension || '.txt',
            });
            setPasswordError('');
            setPasswordDialogOpen(true);
            return;
          }

          if (!looksEncrypted && !isManuallyEncrypted) {
            showNotification(
              'File is encrypted but payload is invalid',
              'error',
            );
            return;
          }
        } catch (decryptError: any) {
          console.error(decryptError);
          showNotification(`Failed to decrypt file`, 'error');
          return;
        }
      }

      openFileInEditor(
        absolutePath,
        item.name,
        originalExtension,
        content,
        isFileEncrypted,
      );
    } catch (error) {
      console.error('Error opening remote file:', error);
      showNotification('Error opening file', 'error');
    }
  };

  const handlePasswordConfirm = async (password: string) => {
    if (!pendingFileData) return;

    try {
      const encryptedData = JSON.parse(pendingFileData.rawContent);
      const result = await window.manualEncryptionAPI.decryptContent(
        encryptedData,
        password,
      );

      if (!result.success) {
        setPasswordError('Wrong password. Please try again.');
        return;
      }

      setPasswordDialogOpen(false);
      setPendingFileData(null);
      setPasswordError('');

      const originalExt =
        (await window.manualEncryptionAPI.getOriginalExtension(
          pendingFileData.rawContent,
        )) || pendingFileData.originalExtension;

      openFileInEditor(
        pendingFileData.absolutePath,
        pendingFileData.item.name,
        originalExt,
        result.data || '',
        true,
        password,
      );
    } catch (error) {
      console.error(error);
      setPasswordError('Wrong password. Please try again.');
    }
  };

  const handleRenameDialogConfirm = async (newName: string) => {
    if (!itemToRename) return { success: false };

    try {
      const result = await window.communityFilesAPI.updateFile(
        itemToRename.id,
        { name: newName },
      );
      if (result.success) {
        const openTab = tabs.find((tab) => tab.filePath === itemToRename.path);
        if (openTab) {
          // If file is open, update tab
          const newTabList = tabs.map((t) => {
            if (t.id === openTab.id) {
              return { ...t, name: newName };
            }
            return t;
          });
          setTabs(newTabList);
        }

        showNotification(
          t('notifications.fileRenamed') || 'Item renamed',
          'success',
        );
        await loadFiles(true);
        return { success: true };
      }
      showNotification(
        t('notifications.fileRenameError') || 'Failed to rename item',
        'error',
      );
      return { success: false };
    } catch (error) {
      console.error(error);
      showNotification(
        t('notifications.fileRenameError') || 'Failed to rename item',
        'error',
      );
      return { success: false };
    } finally {
      setRenameDialogOpen(false);
      setItemToRename(null);
    }
  };

  const handleDeleteConfirmProceed = async () => {
    if (!itemToDelete) return;
    try {
      const result = await window.communityFilesAPI.deleteFile(itemToDelete.id);
      if (result.success) {
        // If open in tab, close it
        const openTab = tabs.find((tab) => tab.filePath === itemToDelete.path);
        if (openTab) {
          setTabs((prev) => prev.filter((tab) => tab.id !== openTab.id));
        }

        showNotification(
          t('notifications.fileDeleted') || 'Item deleted',
          'success',
        );
        await loadFiles(true);
      } else {
        showNotification(
          t('notifications.fileDeleteError') || 'Failed to delete item',
          'error',
        );
      }
    } catch (error) {
      console.error('Delete error', error);
      showNotification(
        t('notifications.fileDeleteError') || 'Failed to delete item',
        'error',
      );
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const renderTreeItems = (
    items: RemoteFileSystemItem[],
    depth = 0,
  ): React.ReactNode => {
    return items.map((item) => {
      const isDirectory = item.type === 'directory';
      const isRoot = item.id === 'meus-arquivos';
      const icon = isRoot ? (
        <CloudIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
      ) : isDirectory ? (
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
            <TreeItemLabel
              icon={icon}
              name={item.name}
              depth={depth}
              isBold={isRoot}
              onContextMenu={
                isRoot ? undefined : (e) => handleContextMenu(e, item)
              }
              actions={
                isDirectory ? (
                  <Box
                    className="folder-actions"
                    sx={{
                      opacity: 0,
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
                        handleCreateFolderInPath(item.id);
                      }}
                      sx={{
                        padding: '2px',
                        color: '#4da6ff',
                        '&:hover': {
                          backgroundColor: 'rgba(77, 166, 255, 0.1)',
                          color: '#3399ff',
                        },
                      }}
                      title={
                        t('sidebar.actions.createFolder') || 'Create folder'
                      }
                    >
                      <CreateNewFolderIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateFileInPath(item.id);
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
                ) : undefined
              }
            />
          }
          sx={{
            '& .MuiTreeItem-content': {
              paddingLeft: '0px !important',
            },
          }}
        >
          {item.children && item.children.length > 0 ? (
            renderTreeItems(item.children, depth + 1)
          ) : item.childrenCount && item.childrenCount > 0 ? (
            <TreeItem
              itemId={`loading-${item.id}`}
              label={t('sidebar.tree.loading') || 'Loading...'}
            />
          ) : null}
        </TreeItem>
      );
    });
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

  return (
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
            disabled={loading}
            onClick={() => loadFiles(false)}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </div>
      </div>
      <div className="tree-container">
        <SimpleTreeView
          aria-label="remote notes tree"
          expandedItems={expandedItems}
          onExpandedItemsChange={handleExpandedItemsChange}
          onItemClick={(_event, itemId) => {
            handleFileClick(itemId);
          }}
          sx={{ flex: 1, overflow: 'auto', ...dialogStyles.scrollbar }}
        >
          {loading && treeData.length === 0 ? (
            <TreeItem
              itemId="loading"
              label={t('sidebar.tree.loading') || 'Loading...'}
            />
          ) : (
            renderTreeItems(treeData)
          )}
        </SimpleTreeView>
      </div>

      <FolderDialog
        open={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        onConfirm={handleFolderDialogConfirm}
      />

      <FileCreationDialog
        open={fileDialogOpen}
        onClose={() => setFileDialogOpen(false)}
        onConfirm={handleFileDialogConfirm}
        isRemote
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
        slotProps={{ paper: { className: 'app-menu-paper' } }}
      >
        <MenuItem onClick={handleContextMenuOpen} className="app-menu-item">
          <ListItemIcon className="app-menu-icon" sx={{ minWidth: '32px' }}>
            <OpenInNewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('contextMenu.open')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleContextMenuRename} className="app-menu-item">
          <ListItemIcon className="app-menu-icon" sx={{ minWidth: '32px' }}>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('contextMenu.rename')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleContextMenuDelete} className="app-menu-item">
          <ListItemIcon className="app-menu-icon" sx={{ minWidth: '32px' }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('contextMenu.delete')}</ListItemText>
        </MenuItem>
      </Menu>

      <RenameDialog
        open={renameDialogOpen}
        onClose={() => {
          setRenameDialogOpen(false);
          setItemToRename(null);
        }}
        onConfirm={handleRenameDialogConfirm}
        currentName={itemToRename?.name || ''}
        itemType={itemToRename?.type === 'directory' ? 'folder' : 'file'}
        isFileOpen={
          itemToRename
            ? tabs.some((tab) => tab.filePath === itemToRename.path)
            : false
        }
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('dialog.delete.title')}
        message={t('dialog.delete.message')}
        confirmLabel={t('dialog.actions.delete')}
        cancelLabel={t('dialog.actions.cancel')}
        onConfirm={handleDeleteConfirmProceed}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
      />

      <PasswordDialog
        open={passwordDialogOpen}
        onClose={() => {
          setPasswordDialogOpen(false);
          setPendingFileData(null);
          setPasswordError('');
        }}
        onConfirm={handlePasswordConfirm}
        filename={pendingFileData?.item.name}
        error={passwordError}
      />
    </div>
  );
}
