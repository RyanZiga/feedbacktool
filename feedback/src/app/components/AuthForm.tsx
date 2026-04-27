import { useState, useEffect } from 'react';
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
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import { Google as GoogleIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import logo from '../../imports/Picsart_26-04-17_15-00-28-825.png';

interface AuthFormProps {
  supabase: any;
}

export function AuthForm({ supabase }: AuthFormProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    // Check if user arrived from password reset email
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');

    if (type === 'recovery') {
      setMode('reset');
    }
  }, []);

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
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'reset') {
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        // Update user's password
        const { error } = await supabase.auth.updateUser({
          password: formData.password,
        });

        if (error) {
          throw error;
        }

        setSuccess('Password updated successfully! You can now sign in with your new password.');

        // Clear URL hash and switch to sign in mode after a delay
        setTimeout(() => {
          window.history.replaceState(null, '', window.location.pathname);
          setMode('signin');
          setFormData({
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
          });
        }, 2000);
      } else if (mode === 'signup') {
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        // Sign up new user
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              role: 'student',
            },
          },
        });

        if (error) {
          throw error;
        }

        setSuccess('Account created successfully! Please check your email to verify your account.');
      } else {
        // Sign in existing user
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          throw error;
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setResetSuccess(false);
    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}`,
      });

      if (error) {
        throw error;
      }

      setResetSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  const handleModeChange = (_: React.SyntheticEvent, newMode: 'signin' | 'signup' | 'reset') => {
    if (newMode !== null && newMode !== 'reset') {
      setMode(newMode);
      setError('');
      setSuccess('');
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    }
  };

  return (
    <>
      <Box className="flex items-center justify-center min-h-[80vh]">
        <Card
          sx={{
            maxWidth: 500,
            width: '100%',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
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

            <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontSize: { xs: '1.75rem', sm: '2rem' } }}>
              {mode === 'reset' ? 'Reset Password' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
            </Typography>

            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              {mode === 'reset' ? 'Enter your new password below' : 'Northeastern Cebu Colleges Feedback System'}
            </Typography>

            {mode !== 'reset' && (
              <>
                <Tabs
                  value={mode}
                  onChange={handleModeChange}
                  variant="fullWidth"
                  sx={{ mb: 3 }}
                >
                  <Tab label="Sign In" value="signin" />
                  <Tab label="Sign Up" value="signup" />
                </Tabs>

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
              </>
            )}

            <form onSubmit={handleSubmit}>
              {mode === 'reset' ? (
                <>
                  <TextField
                    label="New Password"
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

                  <TextField
                    label="Confirm New Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    fullWidth
                    required
                    margin="normal"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              onMouseDown={(e) => e.preventDefault()}
                              edge="end"
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </>
              ) : (
                <>
                  {mode === 'signup' && (
                    <TextField
                      label="Full Name"
                      type="text"
                      fullWidth
                      required
                      margin="normal"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  )}

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

                  {mode === 'signup' && (
                    <TextField
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      fullWidth
                      required
                      margin="normal"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                onMouseDown={(e) => e.preventDefault()}
                                edge="end"
                              >
                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  )}

                  {mode === 'signin' && (
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                      <Link
                        component="button"
                        type="button"
                        variant="body2"
                        onClick={() => setForgotPasswordOpen(true)}
                        sx={{ cursor: 'pointer' }}
                      >
                        Forgot Password?
                      </Link>
                    </Box>
                  )}
                </>
              )}

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {success}
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
                {loading
                  ? mode === 'reset'
                    ? 'Updating password...'
                    : mode === 'signin'
                    ? 'Signing in...'
                    : 'Creating account...'
                  : mode === 'reset'
                  ? 'Update Password'
                  : mode === 'signin'
                  ? 'Sign In'
                  : 'Sign Up'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>

      <Dialog
        open={forgotPasswordOpen}
        onClose={() => {
          setForgotPasswordOpen(false);
          setResetEmail('');
          setResetSuccess(false);
          setError('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          },
        }}
      >
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          {!resetSuccess ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter your email address and we'll send you a link to reset your password.
              </Typography>
              <TextField
                autoFocus
                fullWidth
                margin="normal"
                label="Email Address"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </>
          ) : (
            <Alert severity="success" sx={{ mt: 1 }}>
              Password reset link has been sent to your email. Please check your inbox.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => {
            setForgotPasswordOpen(false);
            setResetEmail('');
            setResetSuccess(false);
            setError('');
          }}>
            {resetSuccess ? 'Close' : 'Cancel'}
          </Button>
          {!resetSuccess && (
            <Button
              onClick={handleForgotPassword}
              variant="contained"
              disabled={resetLoading || !resetEmail}
            >
              {resetLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
