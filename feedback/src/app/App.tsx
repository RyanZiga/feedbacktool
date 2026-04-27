import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { projectId } from '../../utils/supabase/info';
import { Box, Container, AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { ThemeProvider, useThemeMode } from '../context/ThemeContext';
import { StudentView } from './components/StudentView';
import { AdminView } from './components/AdminView';
import { AuthForm } from './components/AuthForm';
import { RoleSelection } from './components/RoleSelection';
import logo from '../imports/Picsart_26-04-17_15-00-28-825.png';
import backgroundImage from '../imports/497700266_24563998693197599_6698511416498390059_n.jpg';

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

  const handleRoleSet = async () => {
    // Reload the session to get updated user metadata
    const { data: { session: updatedSession } } = await supabase.auth.getSession();
    setSession(updatedSession);
    if (updatedSession?.user?.user_metadata?.role) {
      setUserRole(updatedSession.user.user_metadata.role);
    }
  };

  if (loading) {
    return (
      <Box className="flex items-center justify-center min-h-screen">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (userRole === 'admin' && session) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: mode === 'dark' ? 0.15 : 0.1,
            zIndex: 0,
          },
          '&::after': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: mode === 'dark'
              ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
              : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)',
            opacity: 0.85,
            zIndex: 0,
          },
        }}
      >
        <AdminView session={session} onSignOut={handleSignOut} toggleTheme={toggleTheme} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: mode === 'dark' ? 0.15 : 0.1,
          zIndex: 0,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: mode === 'dark'
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
            : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)',
          opacity: 0.85,
          zIndex: 0,
        },
      }}
    >
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(20px)',
          backgroundColor: mode === 'dark'
            ? 'rgba(30, 41, 59, 0.8)'
            : 'rgba(255, 255, 255, 0.8)',
          borderBottom: mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <img
              src={logo}
              alt="NCC Logo"
              style={{
                width: '50px',
                height: '50px',
              }}
            />
            <Box>
              <Typography variant="h6" component="div" sx={{ color: 'inherit', lineHeight: 1.2 }}>
                Feedback System
              </Typography>
              <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.8 }}>
                Northeastern Cebu Colleges
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={toggleTheme} sx={{ mr: 2, color: 'inherit' }}>
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          {session && (
            <>
              <Typography variant="body2" sx={{ mr: 2, color: 'inherit', display: { xs: 'none', sm: 'block' } }}>
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

      <Container maxWidth="lg" sx={{ mt: 4, pb: 4, position: 'relative', zIndex: 1 }}>
        {!session ? (
          <AuthForm supabase={supabase} />
        ) : !userRole ? (
          <RoleSelection user={session.user} onRoleSet={handleRoleSet} />
        ) : userRole === 'student' ? (
          <StudentView session={session} />
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