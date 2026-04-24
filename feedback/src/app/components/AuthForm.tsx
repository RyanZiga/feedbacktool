import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Divider,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Google as GoogleIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import logo from '../../imports/Picsart_26-04-17_15-00-28-825.png';

interface AuthFormProps {
  supabase: any;
}

export function AuthForm({ supabase }: AuthFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Google sign-in failed');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="flex items-center justify-center min-h-[80vh]">
      <Card
        sx={{
          maxWidth: 500,
          width: '100%',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <img
              src={logo}
              alt="Northeastern Cebu Colleges"
              style={{
                width: '120px',
                height: '120px',
              }}
            />
          </Box>

          <Typography variant="h4" component="h1" gutterBottom align="center">
            Sign In
          </Typography>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Northeastern Cebu Colleges Feedback System
          </Typography>

          <Button
            variant="outlined"
            fullWidth
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            disabled={loading}
            sx={{ mb: 2 }}
          >
            Continue with Google
          </Button>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <form onSubmit={handleSubmit}>

            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              margin="normal"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              required
              margin="normal"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
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

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
