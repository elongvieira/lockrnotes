import React, { useState, useEffect, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Checkbox from '@mui/material/Checkbox';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LockResetIcon from '@mui/icons-material/LockReset';
import { useTranslation } from 'react-i18next';
import { dialogStyles } from '../../styles/dialogStyles';
import ConfirmDialog from '../ConfirmDialog';
import type { AdminUser } from '../../../main/preload/communityAdminApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Reads profile.name from the user object returned by the API */
function detectRole(user: AdminUser | null): string {
  if (!user) return 'user';
  const name = user.profile?.name?.toLowerCase();
  if (name === 'admin') return 'admin';
  return 'user';
}

/** Shared styles for Select dropdowns */
const selectSx = {
  backgroundColor: 'var(--bg-tree-container)',
  color: 'var(--text-primary)',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--border-secondary)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--primary-blue)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--primary-blue)',
    borderWidth: '2px',
  },
  '& .MuiSelect-icon': { color: 'var(--text-secondary)' },
};

const selectMenuProps = {
  PaperProps: {
    sx: {
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-primary)',
      '& .MuiMenuItem-root': {
        color: 'var(--text-primary)',
        fontSize: 13,
        '&:hover': { backgroundColor: 'var(--hover-bg)' },
        '&.Mui-selected': {
          backgroundColor: 'var(--primary-blue-light)',
          color: 'var(--primary-blue)',
          '&:hover': { backgroundColor: 'var(--primary-blue-light)' },
        },
      },
    },
  },
};

const switchSx = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--primary-blue)' },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: 'var(--primary-blue)',
  },
};

const checkboxSx = {
  color: 'var(--text-secondary)',
  '&.Mui-checked': { color: 'var(--primary-blue)' },
};

// ─── Create User Dialog ───────────────────────────────────────────────────────

interface CreateUserDialogProps {
  open: boolean;
  adminProfileId: string | undefined;
  userProfileId: string | undefined;
  onClose: () => void;
  onCreated: () => void;
}

function CreateUserDialog({
  open,
  adminProfileId,
  userProfileId,
  onClose,
  onCreated,
}: CreateUserDialogProps) {
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loginType, setLoginType] = useState<'password' | 'magic_link'>(
    'password',
  );
  const [password, setPassword] = useState('');
  const [profileRole, setProfileRole] = useState<'admin' | 'user'>('user');
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setEmail('');
      setLoginType('password');
      setPassword('');
      setProfileRole('user');
      setForcePasswordChange(false);
      setError('');
    }
  }, [open]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t('admin.dialog.users.errors.nameRequired'));
      return;
    }
    if (!email.trim()) {
      setError(t('admin.dialog.users.errors.emailRequired'));
      return;
    }
    if (loginType === 'password' && !password) {
      setError(t('admin.dialog.users.errors.passwordRequired'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const profileId =
        profileRole === 'admin' ? adminProfileId : userProfileId;
      const params: {
        name: string;
        email: string;
        loginType: string;
        password?: string;
        profileId?: string;
      } = {
        name: name.trim(),
        email: email.trim(),
        loginType,
      };
      if (loginType === 'password' && password) params.password = password;
      if (profileId) params.profileId = profileId;

      const createResult = await window.communityAdminAPI.createUser(params);
      if (!createResult.success) {
        throw new Error(
          createResult.error || t('admin.dialog.users.errors.createFailed'),
        );
      }

      if (forcePasswordChange && createResult.user) {
        await window.communityAdminAPI.forcePasswordChangeUser(
          createResult.user.id,
        );
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: dialogStyles.dialogPaper }}
    >
      <DialogTitle sx={dialogStyles.dialogTitle}>
        {t('admin.dialog.users.form.titleCreate')}
      </DialogTitle>
      <DialogContent sx={dialogStyles.dialogContent}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ fontSize: 13 }}>
              {error}
            </Alert>
          )}
          <TextField
            label={t('admin.dialog.users.form.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
            disabled={saving}
            sx={dialogStyles.textField}
          />
          <TextField
            label={t('admin.dialog.users.form.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            size="small"
            disabled={saving}
            sx={dialogStyles.textField}
          />
          <FormControl fullWidth size="small">
            <InputLabel
              sx={{
                color: 'var(--text-secondary)',
                '&.Mui-focused': { color: 'var(--primary-blue)' },
              }}
            >
              {t('admin.dialog.users.form.loginType')}
            </InputLabel>
            <Select
              value={loginType}
              label={t('admin.dialog.users.form.loginType')}
              onChange={(e) =>
                setLoginType(e.target.value as 'password' | 'magic_link')
              }
              disabled={saving}
              sx={selectSx}
              MenuProps={selectMenuProps}
            >
              <MenuItem value="password">
                {t('admin.dialog.users.loginTypes.password')}
              </MenuItem>
              <MenuItem value="magic_link">
                {t('admin.dialog.users.loginTypes.magicLink')}
              </MenuItem>
            </Select>
          </FormControl>
          {loginType === 'password' && (
            <TextField
              label={t('admin.dialog.users.form.password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              size="small"
              disabled={saving}
              sx={dialogStyles.textField}
            />
          )}
          <FormControl fullWidth size="small">
            <InputLabel
              sx={{
                color: 'var(--text-secondary)',
                '&.Mui-focused': { color: 'var(--primary-blue)' },
              }}
            >
              {t('admin.dialog.users.form.role')}
            </InputLabel>
            <Select
              value={profileRole}
              label={t('admin.dialog.users.form.role')}
              onChange={(e) =>
                setProfileRole(e.target.value as 'admin' | 'user')
              }
              disabled={saving || (profileRole === 'admin' && !adminProfileId)}
              sx={selectSx}
              MenuProps={selectMenuProps}
            >
              <MenuItem value="user">
                {t('admin.dialog.users.roles.user')}
              </MenuItem>
              <MenuItem value="admin" disabled={!adminProfileId}>
                {t('admin.dialog.users.roles.admin')}
              </MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={forcePasswordChange}
                onChange={(e) => setForcePasswordChange(e.target.checked)}
                disabled={saving || loginType !== 'password'}
                size="small"
                sx={checkboxSx}
              />
            }
            label={
              <Typography sx={{ ...dialogStyles.secondaryText, fontSize: 13 }}>
                {t('admin.dialog.users.form.forcePasswordChange')}
              </Typography>
            }
          />
        </Box>
      </DialogContent>
      <DialogActions sx={dialogStyles.dialogActions}>
        <Button
          onClick={onClose}
          disabled={saving}
          sx={dialogStyles.cancelButton}
        >
          {t('admin.dialog.users.form.cancel')}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          sx={dialogStyles.confirmButton}
          startIcon={
            saving ? <CircularProgress size={14} color="inherit" /> : undefined
          }
        >
          {t('admin.dialog.users.form.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Edit User Dialog ─────────────────────────────────────────────────────────

interface EditUserDialogProps {
  open: boolean;
  user: AdminUser | null;
  adminProfileId: string | undefined;
  userProfileId: string | undefined;
  onClose: () => void;
  onUpdated: () => void;
}

function EditUserDialog({
  open,
  user,
  adminProfileId,
  userProfileId,
  onClose,
  onUpdated,
}: EditUserDialogProps) {
  const { t } = useTranslation();

  const [name, setName] = useState(() => user?.name ?? '');
  const [email, setEmail] = useState(() => user?.email ?? '');
  const [isActive, setIsActive] = useState(() => user?.isActive ?? true);
  const [profileRole, setProfileRole] = useState<'admin' | 'user'>(
    () => detectRole(user) as 'admin' | 'user',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && user) {
      setName(user.name);
      setEmail(user.email);
      setIsActive(user.isActive);
      setProfileRole(detectRole(user) as 'admin' | 'user');
      setError('');
    }
  }, [open, user]);

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      setError(t('admin.dialog.users.errors.nameRequired'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const profileId =
        profileRole === 'admin' ? adminProfileId : userProfileId;
      const params: {
        name: string;
        email: string;
        isActive: boolean;
        profileId?: string;
      } = { name: name.trim(), email: email.trim(), isActive };
      if (profileId) params.profileId = profileId;

      const result = await window.communityAdminAPI.updateUser(user.id, params);
      if (!result.success) {
        throw new Error(
          result.error || t('admin.dialog.users.errors.updateFailed'),
        );
      }
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: dialogStyles.dialogPaper }}
    >
      <DialogTitle sx={dialogStyles.dialogTitle}>
        {t('admin.dialog.users.form.titleEdit')}
      </DialogTitle>
      <DialogContent sx={dialogStyles.dialogContent}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ fontSize: 13 }}>
              {error}
            </Alert>
          )}
          <TextField
            label={t('admin.dialog.users.form.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
            disabled={saving}
            sx={dialogStyles.textField}
          />
          <TextField
            label={t('admin.dialog.users.form.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            size="small"
            disabled={saving}
            sx={dialogStyles.textField}
          />
          <FormControl fullWidth size="small">
            <InputLabel
              sx={{
                color: 'var(--text-secondary)',
                '&.Mui-focused': { color: 'var(--primary-blue)' },
              }}
            >
              {t('admin.dialog.users.form.role')}
            </InputLabel>
            <Select
              value={profileRole}
              label={t('admin.dialog.users.form.role')}
              onChange={(e) =>
                setProfileRole(e.target.value as 'admin' | 'user')
              }
              disabled={saving}
              sx={selectSx}
              MenuProps={selectMenuProps}
            >
              <MenuItem value="user">
                {t('admin.dialog.users.roles.user')}
              </MenuItem>
              <MenuItem value="admin" disabled={!adminProfileId}>
                {t('admin.dialog.users.roles.admin')}
              </MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={saving}
                size="small"
                sx={switchSx}
              />
            }
            label={
              <Typography sx={{ ...dialogStyles.secondaryText, fontSize: 13 }}>
                {t('admin.dialog.users.form.isActive')}
              </Typography>
            }
          />
        </Box>
      </DialogContent>
      <DialogActions sx={dialogStyles.dialogActions}>
        <Button
          onClick={onClose}
          disabled={saving}
          sx={dialogStyles.cancelButton}
        >
          {t('admin.dialog.users.form.cancel')}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          sx={dialogStyles.confirmButton}
          startIcon={
            saving ? <CircularProgress size={14} color="inherit" /> : undefined
          }
        >
          {t('admin.dialog.users.form.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Users Section ────────────────────────────────────────────────────────────

interface UsersSectionProps {
  users: AdminUser[];
  loading: boolean;
  error: string;
  onNew: () => void;
  onEdit: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  onToggleActive: (user: AdminUser) => void;
  onForcePassword: (user: AdminUser) => void;
}

function UsersSection({
  users,
  loading,
  error,
  onNew,
  onEdit,
  onDelete,
  onToggleActive,
  onForcePassword,
}: UsersSectionProps) {
  const { t } = useTranslation();

  const tableHeaderSx = {
    color: 'var(--text-secondary)',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    borderBottom: '1px solid var(--border-primary)',
    py: 1,
    backgroundColor: 'transparent',
  };

  const tableCellSx = {
    color: 'var(--text-primary)',
    fontSize: 13,
    borderBottom: '1px solid var(--border-primary)',
    py: 1,
    backgroundColor: 'transparent',
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2.5,
        }}
      >
        <Typography variant="h6" sx={dialogStyles.headingText}>
          {t('admin.dialog.users.title')}
        </Typography>
        <Button
          size="small"
          variant="contained"
          startIcon={<PersonAddIcon sx={{ fontSize: '16px !important' }} />}
          onClick={onNew}
          sx={{ ...dialogStyles.confirmButton, px: 1.5, fontSize: 13 }}
        >
          {t('admin.dialog.users.newUser')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={28} sx={{ color: 'var(--primary-blue)' }} />
        </Box>
      )}

      {!loading && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={tableHeaderSx}>
                {t('admin.dialog.users.table.name')}
              </TableCell>
              <TableCell sx={tableHeaderSx}>
                {t('admin.dialog.users.table.email')}
              </TableCell>
              <TableCell sx={tableHeaderSx}>
                {t('admin.dialog.users.table.role')}
              </TableCell>
              <TableCell sx={tableHeaderSx}>
                {t('admin.dialog.users.table.status')}
              </TableCell>
              <TableCell
                sx={{ ...tableHeaderSx, width: 100, textAlign: 'right' }}
              >
                {t('admin.dialog.users.table.actions')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 && !error && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  sx={{
                    ...tableCellSx,
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    py: 4,
                    border: 'none',
                  }}
                >
                  {t('admin.dialog.users.empty')}
                </TableCell>
              </TableRow>
            )}
            {users.map((user) => {
              const userIsAdmin = detectRole(user) === 'admin';
              return (
                <TableRow
                  key={user.id}
                  sx={{
                    '&:hover': { backgroundColor: 'var(--hover-bg)' },
                    '&:last-child td': { borderBottom: 'none' },
                  }}
                >
                  <TableCell sx={tableCellSx}>{user.name}</TableCell>
                  <TableCell sx={tableCellSx}>{user.email}</TableCell>
                  <TableCell sx={tableCellSx}>
                    <Chip
                      label={
                        userIsAdmin
                          ? t('admin.dialog.users.roles.admin')
                          : t('admin.dialog.users.roles.user')
                      }
                      size="small"
                      sx={{
                        fontSize: 11,
                        height: 20,
                        backgroundColor: userIsAdmin
                          ? 'var(--primary-blue-light)'
                          : 'var(--bg-tree-container)',
                        color: userIsAdmin
                          ? 'var(--primary-blue)'
                          : 'var(--text-secondary)',
                        border: 'none',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={tableCellSx}>
                    <Chip
                      label={
                        user.isActive
                          ? t('admin.dialog.users.status.active')
                          : t('admin.dialog.users.status.inactive')
                      }
                      size="small"
                      onClick={() => onToggleActive(user)}
                      sx={{
                        cursor: 'pointer',
                        fontSize: 11,
                        height: 20,
                        backgroundColor: user.isActive
                          ? '#1a3a1f'
                          : 'var(--bg-tree-container)',
                        color: user.isActive
                          ? '#4caf50'
                          : 'var(--text-secondary)',
                        border: 'none',
                        '&:hover': { opacity: 0.85 },
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ ...tableCellSx, textAlign: 'right' }}>
                    <Tooltip
                      title={t(
                        'admin.dialog.users.forcePassword.buttonTooltip',
                      )}
                    >
                      <IconButton
                        size="small"
                        onClick={() => onForcePassword(user)}
                        sx={{
                          color: 'var(--text-secondary)',
                          '&:hover': { color: '#e8a000' },
                        }}
                      >
                        <LockResetIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('dialog.actions.rename')}>
                      <IconButton
                        size="small"
                        onClick={() => onEdit(user)}
                        sx={{
                          color: 'var(--text-secondary)',
                          '&:hover': { color: 'var(--primary-blue)' },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('dialog.actions.delete')}>
                      <IconButton
                        size="small"
                        onClick={() => onDelete(user)}
                        sx={{
                          color: 'var(--text-secondary)',
                          '&:hover': { color: '#f85149' },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}

// ─── Main Admin Dialog ────────────────────────────────────────────────────────

type AdminSection = 'users';

interface AdminDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminDialog({ open, onClose }: AdminDialogProps) {
  const { t } = useTranslation();

  const [section, setSection] = useState<AdminSection>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');

  // Sub-dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [forcePasswordTarget, setForcePasswordTarget] =
    useState<AdminUser | null>(null);

  // Derive profile IDs from the loaded users list
  const adminProfileId = users.find((u) => u.profile?.name === 'admin')?.profile
    ?.id;
  const userProfileId = users.find((u) => u.profile?.name === 'user')?.profile
    ?.id;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      const result = await window.communityAdminAPI.listUsers();
      if (result.success && result.users) {
        setUsers(result.users);
      } else {
        setListError(result.error || t('admin.dialog.users.errors.loadFailed'));
      }
    } catch (err: any) {
      setListError(err.message || t('admin.dialog.users.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (open) loadUsers();
  }, [open, loadUsers]);

  const handleToggleActive = async (user: AdminUser) => {
    const fn = user.isActive
      ? window.communityAdminAPI.deactivateUser
      : window.communityAdminAPI.activateUser;
    const result = await fn(user.id);
    if (result.success) {
      loadUsers();
    } else {
      setListError(
        result.error ||
          t(
            user.isActive
              ? 'admin.dialog.users.errors.deactivateFailed'
              : 'admin.dialog.users.errors.activateFailed',
          ),
      );
    }
  };

  const handleForcePasswordConfirm = async () => {
    if (!forcePasswordTarget) return;
    const result = await window.communityAdminAPI.forcePasswordChangeUser(
      forcePasswordTarget.id,
    );
    setForcePasswordTarget(null);
    if (!result.success) {
      setListError(
        result.error || t('admin.dialog.users.errors.forcePasswordFailed'),
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const result = await window.communityAdminAPI.deleteUser(deleteTarget.id);
    setDeleteTarget(null);
    if (result.success) {
      loadUsers();
    } else {
      setListError(result.error || t('admin.dialog.users.errors.deleteFailed'));
    }
  };

  const navItemSx = {
    '&.Mui-selected': {
      backgroundColor: 'var(--primary-blue-light)',
      '& .MuiListItemText-primary': { color: 'var(--primary-blue)' },
      '& .MuiListItemIcon-root': { color: 'var(--primary-blue)' },
      '&:hover': { backgroundColor: 'var(--primary-blue-light)' },
    },
    '&:hover': { backgroundColor: 'var(--hover-bg)' },
    borderRadius: 'var(--border-radius-sm)',
    mx: 0.5,
    mb: 0.25,
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { ...dialogStyles.dialogPaper, height: '600px' } }}
      >
        <DialogTitle
          sx={{
            ...dialogStyles.dialogTitle,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <AdminPanelSettingsIcon
            sx={{ color: 'var(--primary-blue)', fontSize: 20 }}
          />
          {t('admin.dialog.title')}
        </DialogTitle>

        <DialogContent
          sx={{
            ...dialogStyles.dialogContent,
            p: 0,
            display: 'flex',
            height: 'calc(100% - 120px)',
          }}
        >
          {/* Left navigation sidebar */}
          <Box
            sx={{
              width: 200,
              borderRight: '1px solid var(--border-primary)',
              ...dialogStyles.scrollbar,
              overflowY: 'auto',
              pt: 1,
            }}
          >
            <List disablePadding>
              <ListItem disablePadding>
                <ListItemButton
                  selected={section === 'users'}
                  onClick={() => setSection('users')}
                  sx={navItemSx}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 34,
                      color:
                        section === 'users'
                          ? 'var(--primary-blue)'
                          : 'var(--text-secondary)',
                    }}
                  >
                    <PeopleIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('admin.dialog.users.title')}
                    primaryTypographyProps={{
                      sx: { ...dialogStyles.primaryText, fontSize: 14 },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>

          {/* Right content area */}
          <Box
            sx={{
              flex: 1,
              p: 3,
              ...dialogStyles.scrollbar,
              overflowY: 'auto',
            }}
          >
            {section === 'users' && (
              <UsersSection
                users={users}
                loading={loading}
                error={listError}
                onNew={() => setCreateOpen(true)}
                onEdit={(user) => {
                  setEditingUser(user);
                  setEditOpen(true);
                }}
                onDelete={setDeleteTarget}
                onToggleActive={handleToggleActive}
                onForcePassword={setForcePasswordTarget}
              />
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={dialogStyles.dialogActions}>
          <Button onClick={onClose} sx={dialogStyles.cancelButton}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>

      <CreateUserDialog
        open={createOpen}
        adminProfileId={adminProfileId}
        userProfileId={userProfileId}
        onClose={() => setCreateOpen(false)}
        onCreated={loadUsers}
      />

      <EditUserDialog
        key={editingUser?.id ?? 'edit'}
        open={editOpen}
        user={editingUser}
        adminProfileId={adminProfileId}
        userProfileId={userProfileId}
        onClose={() => setEditOpen(false)}
        onUpdated={loadUsers}
      />

      <ConfirmDialog
        open={forcePasswordTarget !== null}
        title={t('admin.dialog.users.forcePassword.title')}
        message={t('admin.dialog.users.forcePassword.message', {
          name: forcePasswordTarget?.name ?? '',
        })}
        onConfirm={handleForcePasswordConfirm}
        onClose={() => setForcePasswordTarget(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t('admin.dialog.users.delete.title')}
        message={t('admin.dialog.users.delete.message', {
          email: deleteTarget?.email ?? '',
        })}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
