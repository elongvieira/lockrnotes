import React, { useState, useEffect, useCallback } from 'react';
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
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StorageIcon from '@mui/icons-material/Storage';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../contexts/AppContext';
import VaultLoginDialog from './VaultLoginDialog';
import FolderDialog from './FolderDialog';
import VaultSecretDialog from './VaultSecretDialog';
import RenameDialog from './RenameDialog';
import ConfirmDialog from './ConfirmDialog';
import TreeItemLabel from './TreeItemLabel';
import { dialogStyles } from '../styles/dialogStyles';
import { fileSystemService } from '../services/fileSystemService';

interface VaultTreeItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: VaultTreeItem[];
  loaded?: boolean;
}

export default function VaultSidebar() {
  const { t } = useTranslation();
  const {
    vaultSession,
    setVaultSession,
    showNotification,
    openFileInEditor,
    tabs,
    setTabs,
    setActiveTab,
  } = useAppContext();

  const [loginOpen, setLoginOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<VaultTreeItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Dialogs
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [secretDialogOpen, setSecretDialogOpen] = useState(false);
  const [vaultRootPath, setVaultRootPath] = useState('');
  const [targetPath, setTargetPath] = useState('');

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<VaultTreeItem | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<VaultTreeItem | null>(null);

  // Context Menu
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    item: VaultTreeItem | null;
  } | null>(null);

  const handleLoginSuccess = (session: {
    host: string;
    port: number;
    mountPath: string;
  }) => {
    setVaultSession(session);
    setLoginOpen(false);
  };

  /** Convert Vault keys list into tree items. Keys ending in / are folders. */
  const keysToTreeItems = (
    keys: string[] | null | undefined,
    parentPath: string,
  ): VaultTreeItem[] => {
    // Ensure keys is always an array
    const keysArray = Array.isArray(keys) ? keys : [];
    const items = keysArray
      .filter((k) => k !== '.folder') // hide folder markers
      .map((key) => {
        const isDir = key.endsWith('/');
        const name = isDir ? key.slice(0, -1) : key;
        const fullPath = `${parentPath}${key}`;
        return {
          id: `vault-${fullPath}`,
          name,
          path: fullPath,
          type: isDir ? ('directory' as const) : ('file' as const),
          children: isDir ? [] : undefined,
          loaded: false,
        };
      });

    // Sort: directories first, then files (within each group, alphabetical)
    return items.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'directory' ? -1 : 1;
    });
  };

  /** Recursively update a tree item by id. */
  const updateTreeItem = (
    items: VaultTreeItem[],
    targetId: string,
    updates: Partial<VaultTreeItem>,
  ): VaultTreeItem[] => {
    return items.map((node) => {
      if (node.id === targetId) {
        return { ...node, ...updates };
      }
      if (node.children) {
        return {
          ...node,
          children: updateTreeItem(node.children, targetId, updates),
        };
      }
      return node;
    });
  };

  /** Find tree item by id recursively. */
  const findItem = (
    items: VaultTreeItem[],
    id: string,
  ): VaultTreeItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItem(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  /** Reload a subtree by path. */
  const reloadSubtree = async (dirPath: string) => {
    try {
      const result = await window.vaultAPI.listSecrets(dirPath);
      if (result.success && result.data) {
        const children = keysToTreeItems(result.data, dirPath);
        // If reloading root, replace entire tree
        if (dirPath === vaultRootPath) {
          setTreeData(children);
        } else {
          // Find parent item ID and update
          const parentId = `vault-${dirPath}`;
          setTreeData((prev) =>
            updateTreeItem(prev, parentId, { children, loaded: true }),
          );
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to reload subtree', err);
    }
  };

  const loadRootSecrets = useCallback(async () => {
    if (!vaultSession) return;
    setLoading(true);
    try {
      const rootPath = '';
      const result = await window.vaultAPI.listSecrets(rootPath);

      if (result.success && result.data) {
        const items = keysToTreeItems(result.data, rootPath);
        setVaultRootPath(rootPath);
        setTargetPath(rootPath);
        setExpandedItems([]);
        setTreeData(items);
      } else {
        setVaultRootPath(rootPath);
        setTargetPath(rootPath);
        setExpandedItems([]);
        setTreeData([]);
        // Only show error if it's not a 'no data' situation
        if (result.error && !result.error.includes('404')) {
          showNotification(
            result.error ||
              t('vault.errors.loadFailed') ||
              'Failed to load secrets',
            'error',
          );
        }
      }
    } catch (err) {
      console.error(err);
      showNotification(
        t('vault.errors.loadFailed') || 'Error loading secrets',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [vaultSession, showNotification, t]);

  useEffect(() => {
    if (vaultSession) {
      loadRootSecrets();
    } else {
      // Clear cached secrets when session ends
      setTreeData([]);
      setExpandedItems([]);
      setVaultRootPath('');
      setTargetPath('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaultSession]);

  const fetchFolderContents = async (item: VaultTreeItem) => {
    if (item.loaded) return;
    try {
      const result = await window.vaultAPI.listSecrets(item.path);
      if (result.success && result.data) {
        const children = keysToTreeItems(result.data, item.path);
        setTreeData((prev) =>
          updateTreeItem(prev, item.id, { children, loaded: true }),
        );
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

    for (const itemId of itemIds) {
      const item = findItem(treeData, itemId);
      if (item && item.type === 'directory' && !item.loaded) {
        await fetchFolderContents(item);
      }
    }
  };

  // ─── File operations ──────────────────────────────────────────

  const handleSecretClick = async (itemId: string) => {
    const item = findItem(treeData, itemId);
    if (!item || item.type === 'directory') return;

    const vaultFilePath = `vault://${item.path}`;

    // Check if already open
    const existingTab = tabs.find((tab) => tab.filePath === vaultFilePath);
    if (existingTab) {
      setActiveTab(existingTab.id);
      return;
    }

    try {
      const content = await fileSystemService.readFile(vaultFilePath);
      if (content === null) {
        showNotification(
          t('vault.errors.readFailed') || 'Failed to read secret',
          'error',
        );
        return;
      }

      openFileInEditor(vaultFilePath, item.name, '.json', content, false);
    } catch (error) {
      console.error('Error opening vault secret:', error);
      showNotification(
        t('vault.errors.readFailed') || 'Error opening secret',
        'error',
      );
    }
  };

  // ─── Create operations ────────────────────────────────────────

  const handleCreateFolder = () => {
    setTargetPath(vaultRootPath);
    setFolderDialogOpen(true);
  };

  const handleCreateSecret = () => {
    setTargetPath(vaultRootPath);
    setSecretDialogOpen(true);
  };

  const handleCreateFolderInPath = (dirPath: string) => {
    setTargetPath(dirPath);
    setFolderDialogOpen(true);
  };

  const handleCreateSecretInPath = (dirPath: string) => {
    setTargetPath(dirPath);
    setSecretDialogOpen(true);
  };

  const handleFolderDialogConfirm = async (folderName: string) => {
    try {
      const fullPath = `${targetPath}${folderName}`;
      const result = await window.vaultAPI.createFolder(fullPath);
      if (result.success) {
        showNotification(
          t('notifications.folderCreated') || 'Folder created',
          'success',
        );
        // Reset loaded state for parent and reload
        await reloadSubtree(targetPath);
      } else {
        showNotification(
          result.error ||
            t('notifications.folderCreationError') ||
            'Error creating folder',
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

  const handleSecretDialogConfirm = async (
    secretName: string,
    type: 'default' | 'json',
  ) => {
    try {
      const fullPath = `${targetPath}${secretName}`;

      let initialData: Record<string, any>;
      if (type === 'json') {
        initialData = { _editor_pattern: 'json', entries: [] };
      } else {
        initialData = { entries: '[]' };
      }

      const result = await window.vaultAPI.saveSecret(fullPath, initialData);
      if (result.success) {
        showNotification(
          t('notifications.fileCreated') || 'Secret created',
          'success',
        );
        await reloadSubtree(targetPath);
      } else {
        showNotification(
          result.error ||
            t('notifications.fileCreationError') ||
            'Error creating secret',
          'error',
        );
      }
    } catch (err) {
      console.error(err);
      showNotification(
        t('notifications.fileCreationError') || 'Error creating secret',
        'error',
      );
    }
    setSecretDialogOpen(false);
  };

  // ─── Context Menu ─────────────────────────────────────────────

  const handleContextMenu = (event: React.MouseEvent, item: VaultTreeItem) => {
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
    if (contextMenu?.item && contextMenu.item.type === 'file') {
      handleSecretClick(contextMenu.item.id);
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

  const handleRenameDialogConfirm = async (newName: string) => {
    if (!itemToRename) return { success: false };

    try {
      // Read old secret
      const readResult = await window.vaultAPI.getSecret(itemToRename.path);
      if (!readResult.success) {
        showNotification(
          t('notifications.fileRenameError') || 'Failed to rename',
          'error',
        );
        return { success: false };
      }

      // Compute new path
      const parentPath = itemToRename.path.substring(
        0,
        itemToRename.path.lastIndexOf(itemToRename.name),
      );
      const newPath = `${parentPath}${newName}`;

      // Write to new path
      await window.vaultAPI.saveSecret(newPath, readResult.data || {});
      // Delete old path
      await window.vaultAPI.deleteSecret(itemToRename.path);

      // Update open tabs
      const oldVaultPath = `vault://${itemToRename.path}`;
      const openTab = tabs.find((tab) => tab.filePath === oldVaultPath);
      if (openTab) {
        setTabs(
          tabs.map((tab) =>
            tab.id === openTab.id
              ? { ...tab, filename: newName, filePath: `vault://${newPath}` }
              : tab,
          ),
        );
      }

      showNotification(
        t('notifications.fileRenamed') || 'Renamed successfully',
        'success',
      );
      await reloadSubtree(parentPath);
      return { success: true };
    } catch (error) {
      console.error(error);
      showNotification(
        t('notifications.fileRenameError') || 'Failed to rename',
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
      const result = await window.vaultAPI.deleteSecret(itemToDelete.path);
      if (result.success) {
        // Close open tab if exists
        const vaultFilePath = `vault://${itemToDelete.path}`;
        const openTab = tabs.find((tab) => tab.filePath === vaultFilePath);
        if (openTab) {
          setTabs((prev) => prev.filter((tab) => tab.id !== openTab.id));
        }

        showNotification(
          t('notifications.fileDeleted') || 'Deleted successfully',
          'success',
        );

        // Reload parent
        const parentPath = itemToDelete.path.substring(
          0,
          itemToDelete.path.lastIndexOf(itemToDelete.name),
        );
        await reloadSubtree(parentPath || vaultRootPath);
      } else {
        showNotification(
          result.error ||
            t('notifications.fileDeleteError') ||
            'Failed to delete',
          'error',
        );
      }
    } catch (error) {
      console.error('Delete error', error);
      showNotification(
        t('notifications.fileDeleteError') || 'Failed to delete',
        'error',
      );
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  // ─── Tree rendering ───────────────────────────────────────────

  const renderTreeItems = (
    items: VaultTreeItem[],
    depth = 0,
  ): React.ReactNode => {
    return items.map((item) => {
      const isDirectory = item.type === 'directory';
      const iconSx = { fontSize: 16, mr: 0.5, verticalAlign: 'middle' };
      const icon = isDirectory ? (
        <FolderIcon sx={iconSx} />
      ) : (
        <InsertDriveFileIcon sx={iconSx} />
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
              onContextMenu={(e) => handleContextMenu(e, item)}
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
                        handleCreateSecretInPath(item.path);
                      }}
                      sx={{
                        padding: '2px',
                        color: '#4da6ff',
                        '&:hover': {
                          backgroundColor: 'rgba(77, 166, 255, 0.1)',
                          color: '#3399ff',
                        },
                      }}
                      title={t('vault.actions.createSecret') || 'Create secret'}
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
          {(() => {
            if (item.children && item.children.length > 0) {
              return renderTreeItems(item.children, depth + 1);
            }
            if (item.type === 'directory' && !item.loaded) {
              return (
                <TreeItem
                  itemId={`loading-${item.id}`}
                  label={t('sidebar.tree.loading') || 'Loading...'}
                />
              );
            }
            return null;
          })()}
        </TreeItem>
      );
    });
  };

  // ─── Not connected state ──────────────────────────────────────

  if (!vaultSession) {
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
          <StorageIcon sx={{ fontSize: 56, color: 'var(--primary-blue)' }} />
          <Typography
            variant="body2"
            sx={{ color: 'var(--text-secondary)', textAlign: 'center' }}
          >
            {t('vault.notConnected') ||
              'Connect to a Vault server to access secrets.'}
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={() => setLoginOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            {t('vault.loginButton') || 'Connect'}
          </Button>
        </Box>
        <VaultLoginDialog
          open={loginOpen}
          onClose={() => setLoginOpen(false)}
          onSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  // ─── Connected state ──────────────────────────────────────────

  return (
    <div className="files-card">
      <div className="files-card-header">
        <h4>{t('vault.sidebar.title') || 'Secrets'}</h4>
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
            title={t('vault.actions.createSecret') || 'Create secret'}
            onClick={handleCreateSecret}
          >
            <NoteAddIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            title={t('sidebar.actions.refresh') || 'Refresh'}
            disabled={loading}
            onClick={() => loadRootSecrets()}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </div>
      </div>
      <div className="tree-container">
        <SimpleTreeView
          aria-label="vault secrets tree"
          expandedItems={expandedItems}
          onExpandedItemsChange={handleExpandedItemsChange}
          onItemClick={(_event, itemId) => {
            handleSecretClick(itemId);
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

      <VaultSecretDialog
        open={secretDialogOpen}
        onClose={() => setSecretDialogOpen(false)}
        onConfirm={handleSecretDialogConfirm}
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
        {contextMenu?.item?.type === 'file' && (
          <MenuItem onClick={handleContextMenuOpen} className="app-menu-item">
            <ListItemIcon className="app-menu-icon" sx={{ minWidth: '32px' }}>
              <OpenInNewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('contextMenu.open')}</ListItemText>
          </MenuItem>
        )}
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
            ? tabs.some(
                (tab) => tab.filePath === `vault://${itemToRename.path}`,
              )
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
    </div>
  );
}
