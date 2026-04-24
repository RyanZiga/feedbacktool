import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  Feedback as FeedbackIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { projectId } from '../../../../utils/supabase/info';
import { supabase } from '../../../utils/supabase';
import { CATEGORIES, getCategoryColor } from '../../../utils/categoryUtils';

interface AdminDashboardProps {
  session: any;
}

export function AdminDashboard({ session }: AdminDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    declined: 0,
    byCategory: [] as any[],
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8a3aee84/feedback`,
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
        throw new Error(data.error || 'Failed to load feedback');
      }

      const feedbackList = data.feedback || [];
      const pending = feedbackList.filter((f: any) => f.status === 'pending').length;
      const accepted = feedbackList.filter((f: any) => f.status === 'accepted').length;
      const declined = feedbackList.filter((f: any) => f.status === 'declined').length;

      const categoryCount: any = {};
      CATEGORIES.forEach(cat => {
        categoryCount[cat] = feedbackList.filter((f: any) => f.category === cat).length;
      });

      const byCategory = Object.entries(categoryCount).map(([name, value]) => ({
        name,
        value,
      }));

      setStats({
        total: feedbackList.length,
        pending,
        accepted,
        declined,
        byCategory,
      });
    } catch (err: any) {
      console.error('Load stats error:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box className="flex items-center justify-center py-12">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  const statusData = [
    { name: 'Pending', value: stats.pending },
    { name: 'Accepted', value: stats.accepted },
    { name: 'Declined', value: stats.declined },
  ];

  const COLORS = ['#fbbf24', '#10b981', '#ef4444'];

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card sx={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)', height: '100%' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: color,
              borderRadius: 2,
              p: { xs: 1.5, sm: 2 },
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
        Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Feedbacks"
            value={stats.total}
            icon={<FeedbackIcon sx={{ fontSize: 40 }} />}
            color="#3b82f6"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={<PendingIcon sx={{ fontSize: 40 }} />}
            color="#fbbf24"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Accepted"
            value={stats.accepted}
            icon={<CheckCircleIcon sx={{ fontSize: 40 }} />}
            color="#10b981"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Declined"
            value={stats.declined}
            icon={<CancelIcon sx={{ fontSize: 40 }} />}
            color="#ef4444"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Feedback Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`status-cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Feedback by Category
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6">
                    {stats.byCategory.map((entry, index) => (
                      <Cell key={`category-bar-${entry.name}-${index}`} fill="#3b82f6" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
