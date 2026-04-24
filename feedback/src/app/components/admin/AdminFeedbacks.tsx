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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { projectId } from '../../../../utils/supabase/info';
import { supabase } from '../../../utils/supabase';
import { CATEGORIES, getCategoryColor } from '../../../utils/categoryUtils';

interface AdminFeedbacksProps {
  session: any;
}

interface Feedback {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  title: string;
  description: string;
  category: string;
  attachments: any[];
  status: string;
  createdAt: string;
  adminComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export function AdminFeedbacks({ session }: AdminFeedbacksProps) {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<{ id: string; status: 'accepted' | 'declined' } | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  const openCommentDialog = (feedbackId: string, status: 'accepted' | 'declined') => {
    setSelectedFeedback({ id: feedbackId, status });
    setAdminComment('');
    setCommentDialogOpen(true);
  };

  const closeCommentDialog = () => {
    setCommentDialogOpen(false);
    setSelectedFeedback(null);
    setAdminComment('');
  };

  const submitFeedbackUpdate = async () => {
    if (!selectedFeedback) return;

    setUpdatingId(selectedFeedback.id);
    setError('');
    setCommentDialogOpen(false);

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8a3aee84/feedback/${selectedFeedback.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentSession.access_token}`,
          },
          body: JSON.stringify({
            status: selectedFeedback.status,
            adminComment: adminComment.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Update feedback failed with status:', response.status, 'Data:', data);
        throw new Error(data.error || 'Failed to update feedback');
      }

      await loadFeedback();
      setAdminComment('');
      setSelectedFeedback(null);
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

  const filteredFeedback = feedbackList.filter((feedback) => {
    const matchesCategory = categoryFilter === 'all' || feedback.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || feedback.status === statusFilter;
    return matchesCategory && matchesStatus;
  });

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
        Feedbacks
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Grid container spacing={2} alignItems="stretch">
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="accepted">Accepted</MenuItem>
                  <MenuItem value="declined">Declined</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Chip label={`${filteredFeedback.length} of ${feedbackList.length}`} color="primary" />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {feedbackList.length === 0 ? (
        <Card sx={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body1" color="text.secondary" align="center">
              No feedback submissions yet.
            </Typography>
          </CardContent>
        </Card>
      ) : filteredFeedback.length === 0 ? (
        <Card sx={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body1" color="text.secondary" align="center">
              No feedback matches your filters.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {filteredFeedback.map((feedback) => (
            <Accordion key={feedback.id} sx={{ mb: 2, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box className="flex-1">
                  <Box className="flex items-center gap-2 mb-1 flex-wrap">
                    <Typography variant="h6">{feedback.title}</Typography>
                    <Chip
                      label={feedback.category}
                      size="small"
                      color={getCategoryColor(feedback.category)}
                    />
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
                  <Grid size={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Description:
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {feedback.description}
                    </Typography>
                  </Grid>

                  {feedback.attachments && feedback.attachments.length > 0 && (
                    <Grid size={12}>
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

                  {feedback.adminComment && (
                    <Grid size={12}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 1,
                          backgroundColor: 'action.hover',
                        }}
                      >
                        <Typography variant="subtitle2" gutterBottom>
                          Admin Response:
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {feedback.adminComment}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  <Grid size={12}>
                    <Box className="flex items-center justify-between">
                      <Typography variant="caption" color="text.secondary">
                        Feedback ID: {feedback.id}
                      </Typography>

                      <ButtonGroup variant="contained" disabled={updatingId === feedback.id}>
                        <Button
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => openCommentDialog(feedback.id, 'accepted')}
                          disabled={feedback.status === 'accepted'}
                        >
                          Accept
                        </Button>
                        <Button
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => openCommentDialog(feedback.id, 'declined')}
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

      <Dialog
        open={commentDialogOpen}
        onClose={closeCommentDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          },
        }}
      >
        <DialogTitle>
          {selectedFeedback?.status === 'accepted' ? 'Accept Feedback' : 'Decline Feedback'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add a comment to explain your decision to the student (optional but recommended):
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={4}
            label="Admin Comment"
            placeholder={
              selectedFeedback?.status === 'accepted'
                ? 'e.g., Great suggestion! We will implement this feature...'
                : 'e.g., Thank you for the feedback, but we cannot implement this because...'
            }
            value={adminComment}
            onChange={(e) => setAdminComment(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeCommentDialog}>Cancel</Button>
          <Button
            onClick={submitFeedbackUpdate}
            variant="contained"
            color={selectedFeedback?.status === 'accepted' ? 'success' : 'error'}
          >
            {selectedFeedback?.status === 'accepted' ? 'Accept' : 'Decline'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
