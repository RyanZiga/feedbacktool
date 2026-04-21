import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  Button,
  ButtonGroup,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { projectId } from '../../../utils/supabase/info';
import { supabase } from '../../utils/supabase';

interface AdminViewProps {
  session: any;
}

interface Feedback {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  title: string;
  description: string;
  attachments: any[];
  status: string;
  createdAt: string;
}

export function AdminView({ session }: AdminViewProps) {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
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

      const data = await response.json();

      if (!response.ok) {
        console.error('Load feedback failed with status:', response.status, 'Data:', data);
        throw new Error(data.error || 'Failed to load feedback');
      }

      const sortedFeedback = (data.feedback || []).sort(
        (a: Feedback, b: Feedback) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setFeedbackList(sortedFeedback);
    } catch (err: any) {
      console.error('Load feedback error:', err);
      setError(err.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (feedbackId: string, status: 'accepted' | 'declined') => {
    setUpdatingId(feedbackId);
    setError('');

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8a3aee84/feedback/${feedbackId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentSession.access_token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Update feedback failed with status:', response.status, 'Data:', data);
        throw new Error(data.error || 'Failed to update feedback');
      }

      // Reload feedback list to show updated status
      await loadFeedback();
    } catch (err: any) {
      console.error('Update feedback error:', err);
      setError(err.message || 'Failed to update feedback');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <Box className="flex items-center justify-center py-12">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box className="flex justify-between items-center mb-4">
        <Typography variant="h4">Feedback Review Dashboard</Typography>
        <Chip label={`${feedbackList.length} Total`} color="primary" />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {feedbackList.length === 0 ? (
        <Card sx={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body1" color="text.secondary" align="center">
              No feedback submissions yet.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {feedbackList.map((feedback) => (
            <Accordion key={feedback.id} sx={{ mb: 2, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box className="flex-1">
                  <Box className="flex items-center gap-2 mb-1">
                    <Typography variant="h6">{feedback.title}</Typography>
                    <Chip
                      label={feedback.status}
                      size="small"
                      color={
                        feedback.status === 'accepted'
                          ? 'success'
                          : feedback.status === 'declined'
                          ? 'error'
                          : 'warning'
                      }
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Submitted by {feedback.studentName} ({feedback.studentEmail}) on{' '}
                    {new Date(feedback.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Description:
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {feedback.description}
                    </Typography>
                  </Grid>

                  {feedback.attachments && feedback.attachments.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Attachments ({feedback.attachments.length}):
                      </Typography>
                      <Box className="flex flex-col gap-2">
                        {feedback.attachments.map((attachment, index) => (
                          <Box key={index} className="flex items-center gap-2">
                            <AttachFileIcon fontSize="small" />
                            <Link
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {attachment.fileName}
                            </Link>
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Box className="flex items-center justify-between">
                      <Typography variant="caption" color="text.secondary">
                        Feedback ID: {feedback.id}
                      </Typography>

                      <ButtonGroup variant="contained" disabled={updatingId === feedback.id}>
                        <Button
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => updateFeedbackStatus(feedback.id, 'accepted')}
                          disabled={feedback.status === 'accepted'}
                        >
                          Accept
                        </Button>
                        <Button
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => updateFeedbackStatus(feedback.id, 'declined')}
                          disabled={feedback.status === 'declined'}
                        >
                          Decline
                        </Button>
                      </ButtonGroup>
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );
}
