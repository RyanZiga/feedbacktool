import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  Alert,
} from '@mui/material';
import { Person as PersonIcon, AdminPanelSettings as AdminIcon } from '@mui/icons-material';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { supabase } from '../../utils/supabase';

interface RoleSelectionProps {
  user: any;
  onRoleSet: () => void;
}

export function RoleSelection({ user, onRoleSet }: RoleSelectionProps) {
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetRole = async () => {
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        data: { role, name: user.user_metadata?.full_name || user.email?.split('@')[0] }
      });

      if (error) {
        throw error;
      }

      onRoleSet();
    } catch (err: any) {
      console.error('Set role error:', err);
      setError(err.message || 'Failed to set role');
      setLoading(false);
    }
  };

  return (
    <Box className="flex items-center justify-center min-h-[80vh]">
      <Card
        sx={{
          maxWidth: 500,
          width: '100%',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Welcome!
          </Typography>

          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Please select your role to continue
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              I am a:
            </Typography>
            <ToggleButtonGroup
              value={role}
              exclusive
              onChange={(_, value) => value && setRole(value)}
              fullWidth
              sx={{ mt: 1 }}
            >
              <ToggleButton value="student">
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1 }}>
                  <PersonIcon sx={{ mb: 1 }} />
                  <Typography>Student</Typography>
                </Box>
              </ToggleButton>
              <ToggleButton value="admin">
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1 }}>
                  <AdminIcon sx={{ mb: 1 }} />
                  <Typography>Admin</Typography>
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleSetRole}
            disabled={loading}
          >
            {loading ? 'Setting up...' : 'Continue'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
