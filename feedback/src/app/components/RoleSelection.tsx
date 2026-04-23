import { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { supabase } from '../../utils/supabase';

interface RoleSelectionProps {
  user: any;
  onRoleSet: () => void;
}

export function RoleSelection({ user, onRoleSet }: RoleSelectionProps) {
  const [error, setError] = useState('');

  useEffect(() => {
    // Automatically set Google OAuth users as students
    const setDefaultRole = async () => {
      try {
        const { error } = await supabase.auth.updateUser({
          data: { role: 'student', name: user.user_metadata?.full_name || user.email?.split('@')[0] }
        });

        if (error) {
          throw error;
        }

        onRoleSet();
      } catch (err: any) {
        console.error('Set role error:', err);
        setError(err.message || 'Failed to set role');
      }
    };

    setDefaultRole();
  }, [user, onRoleSet]);

  if (error) {
    return (
      <Box className="flex items-center justify-center min-h-[80vh]">
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Error setting up account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="flex flex-col items-center justify-center min-h-[80vh]">
      <CircularProgress size={60} sx={{ mb: 3 }} />
      <Typography variant="h6" gutterBottom>
        Setting up your account...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        You'll be logged in as a student
      </Typography>
    </Box>
  );
}
