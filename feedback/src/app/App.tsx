import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { projectId } from '../../utils/supabase/info';
import { Box, Container, AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { ThemeProvider, useThemeMode } from '../context/ThemeContext';
import { StudentView } from './components/StudentView';
import { AdminView } from './components/AdminView';
import { AuthForm } from './components/AuthForm';

function AppContent() {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { mode, toggleTheme } = useThemeMode();

  useEffect(() => {
    // Check backend health
    const checkBackend = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-8a3aee84/health`
        );
        const data = await response.json();
        console.log('Backend health check:', data);
      } catch (err) {
        console.error('Backend health check failed - please ensure the edge function is deployed:', err);
      }
    };
    checkBackend();

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.user_metadata?.role) {
        setUserRole(session.user.user_metadata.role);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.user_metadata?.role) {
        setUserRole(session.user.user_metadata.role);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserRole(null);
  };

  if (loading) {
    return (
      <Box className="flex items-center justify-center min-h-screen">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: mode === 'dark'
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
          : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)',
      }}
    >
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'inherit' }}>
            Feedback Tool System
          </Typography>
          <IconButton onClick={toggleTheme} sx={{ mr: 2, color: 'inherit' }}>
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          {session && (
            <>
              <Typography variant="body2" sx={{ mr: 2, color: 'inherit' }}>
                {session.user.user_metadata?.name} ({userRole})
              </Typography>
              <Button
                onClick={handleSignOut}
                sx={{
                  color: 'inherit',
                  '&:hover': {
                    backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                Sign Out
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, pb: 4 }}>
        {!session ? (
          <AuthForm supabase={supabase} />
        ) : userRole === 'student' ? (
          <StudentView session={session} />
        ) : userRole === 'admin' ? (
          <AdminView session={session} />
        ) : (
          <Typography>Invalid user role</Typography>
        )}
      </Container>
    </Box>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}