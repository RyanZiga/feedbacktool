import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
} from '@mui/material';
import { Add as AddIcon, AdminPanelSettings as AdminIcon, Person as PersonIcon, Visibility, VisibilityOff, Edit as EditIcon } from '@mui/icons-material';
import { projectId } from '../../../../utils/supabase/info';
import { supabase } from '../../../utils/supabase';

interface AdminUsersProps {
  session: any;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  studentId?: string;
  createdAt: string;
}

export function AdminUsers({ session }: AdminUsersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    studentId: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8a3aee84/users`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${currentSession.access_token}`,
          },
        }
      );

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response. Please ensure the edge function is deployed.');
      }

      const data = await response.json();

      if (!response.ok) {
        console.error('Load users failed with status:', response.status, 'Data:', data);
        throw new Error(data.error || 'Failed to load users');
      }

      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Load users error:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    setCreating(true);
    setError('');

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8a3aee84/create-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentSession.access_token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response. Please ensure the edge function is deployed.');
      }

      const data = await response.json();

      if (!response.ok) {
        console.error('Create admin failed with status:', response.status, 'Data:', data);
        throw new Error(data.error || 'Failed to create admin');
      }

      setDialogOpen(false);
      setFormData({ email: '', password: '', name: '' });
      await loadUsers();
    } catch (err: any) {
      console.error('Create admin error:', err);
      setError(err.message || 'Failed to create admin');
    } finally {
      setCreating(false);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      studentId: user.studentId || '',
    });
    setEditDialogOpen(true);
    setError('');
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
    setEditFormData({
      name: '',
      email: '',
      studentId: '',
    });
    setError('');
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setUpdating(true);
    setError('');

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8a3aee84/users/${selectedUser.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentSession.access_token}`,
          },
          body: JSON.stringify(editFormData),
        }
      );

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response. Please ensure the edge function is deployed.');
      }

      const data = await response.json();

      if (!response.ok) {
        console.error('Update user failed with status:', response.status, 'Data:', data);
        throw new Error(data.error || 'Failed to update user');
      }

      handleCloseEditDialog();
      await loadUsers();
    } catch (err: any) {
      console.error('Update user error:', err);
      setError(err.message || 'Failed to update user');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Box className="flex items-center justify-center py-12">
        <CircularProgress />
      </Box>
    );
  }

  const adminCount = users.filter(u => u.role === 'admin').length;
  const studentCount = users.filter(u => u.role === 'student').length;

  // Calculate pagination
  const paginatedUsers = users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const startEntry = users.length === 0 ? 0 : page * rowsPerPage + 1;
  const endEntry = Math.min((page + 1) * rowsPerPage, users.length);

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Users
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Add Admin</Box>
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Add</Box>
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip
            icon={<PersonIcon />}
            label={`Students: ${studentCount}`}
            color="primary"
            variant="outlined"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          />
          <Chip
            icon={<AdminIcon />}
            label={`Admins: ${adminCount}`}
            color="secondary"
            variant="outlined"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          />
          <Chip
            label={`Total: ${users.length}`}
            color="default"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Showing {startEntry}-{endEntry} of {users.length}
          </Typography>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Per page</InputLabel>
            <Select
              value={rowsPerPage}
              label="Per page"
              onChange={(e) => handleChangeRowsPerPage(e as any)}
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Card sx={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
        <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', overflowX: 'auto' }}>
          <Table sx={{ minWidth: { xs: 650, sm: 750 } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, p: { xs: 1.5, sm: 2 } }}>Name</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, p: { xs: 1.5, sm: 2 } }}>Email</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, p: { xs: 1.5, sm: 2 } }}>Role</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, p: { xs: 1.5, sm: 2 }, display: { xs: 'none', lg: 'table-cell' } }}>Student ID</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, p: { xs: 1.5, sm: 2 }, display: { xs: 'none', md: 'table-cell' } }}>Created At</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, p: { xs: 1.5, sm: 2 } }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, p: { xs: 1.5, sm: 2 } }}>
                    {user.name}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, p: { xs: 1.5, sm: 2 }, wordBreak: 'break-word' }}>
                    {user.email}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, p: { xs: 1.5, sm: 2 } }}>
                    <Chip
                      icon={user.role === 'admin' ? <AdminIcon /> : <PersonIcon />}
                      label={user.role}
                      size="small"
                      color={user.role === 'admin' ? 'secondary' : 'primary'}
                      sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, p: { xs: 1.5, sm: 2 }, display: { xs: 'none', lg: 'table-cell' } }}>
                    {user.role === 'student' ? (user.studentId || '-') : '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, p: { xs: 1.5, sm: 2 }, display: { xs: 'none', md: 'table-cell' } }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, p: { xs: 1.5, sm: 2 } }}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenEditDialog(user)}
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          component="div"
          count={users.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'transparent',
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            },
          }}
        />
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          },
        }}
      >
        <DialogTitle>Create Admin Account</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="normal"
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateAdmin}
            variant="contained"
            disabled={creating || !formData.email || !formData.password || !formData.name}
          >
            {creating ? 'Creating...' : 'Create Admin'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          },
        }}
      >
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="normal"
            label="Full Name"
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            type="email"
            value={editFormData.email}
            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
          />
          {selectedUser?.role === 'student' && (
            <TextField
              fullWidth
              margin="normal"
              label="Student ID"
              value={editFormData.studentId}
              onChange={(e) => setEditFormData({ ...editFormData, studentId: e.target.value })}
              placeholder="e.g., 2024-001234"
            />
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseEditDialog} disabled={updating}>Cancel</Button>
          <Button
            onClick={handleUpdateUser}
            variant="contained"
            disabled={updating || !editFormData.email || !editFormData.name}
          >
            {updating ? 'Updating...' : 'Update User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
