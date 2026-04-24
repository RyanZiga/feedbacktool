import { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Feedback as FeedbackIcon,
  People as PeopleIcon,
  Brightness4,
  Brightness7,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useThemeMode } from '../../../context/ThemeContext';
import logo from '../../../imports/Picsart_26-04-17_15-00-28-825.png';

const drawerWidth = 240;

interface AdminLayoutProps {
  children: React.ReactNode;
  currentView: 'dashboard' | 'feedbacks' | 'users';
  onViewChange: (view: 'dashboard' | 'feedbacks' | 'users') => void;
  userName: string;
  onSignOut: () => void;
  toggleTheme: () => void;
}

export function AdminLayout({ children, currentView, onViewChange, userName, onSignOut, toggleTheme }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { mode } = useThemeMode();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'feedbacks', label: 'Feedbacks', icon: <FeedbackIcon /> },
    { id: 'users', label: 'Users', icon: <PeopleIcon /> },
  ];

  const drawer = (
    <Box>
      <Toolbar
        sx={{
          background: mode === 'dark'
            ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 2,
        }}
      >
        <img
          src={logo}
          alt="NCC Logo"
          style={{
            width: '80px',
            height: '80px',
            marginBottom: '8px',
          }}
        />
        <Typography variant="h6" noWrap component="div" align="center">
          Admin Panel
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Welcome back,
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          {userName}
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={currentView === item.id}
              onClick={() => onViewChange(item.id as any)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: mode === 'dark'
                    ? 'rgba(96, 165, 250, 0.2)'
                    : 'rgba(59, 130, 246, 0.1)',
                  borderRight: '3px solid',
                  borderColor: 'primary.main',
                },
              }}
            >
              <ListItemIcon sx={{ color: currentView === item.id ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          onClick={toggleTheme}
          sx={{ justifyContent: 'flex-start' }}
        >
          {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </Button>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={onSignOut}
          sx={{ justifyContent: 'flex-start' }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          display: { sm: 'none' },
          zIndex: 3,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Admin Panel
          </Typography>
          <IconButton onClick={toggleTheme} sx={{ color: 'inherit' }}>
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 }, position: 'relative', zIndex: 2 }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              background: mode === 'dark'
                ? 'rgba(30, 41, 59, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              background: mode === 'dark'
                ? 'rgba(30, 41, 59, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRight: mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(0, 0, 0, 0.1)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 7, sm: 0 },
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
