import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Link,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  AttachFile as AttachFileIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { projectId } from '../../../utils/supabase/info';
import { supabase } from '../../utils/supabase';
import { CATEGORIES, getCategoryColor } from '../../utils/categoryUtils';

interface StudentViewProps {
  session: any;
}

export function StudentView({ session }: StudentViewProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadFeedbackHistory();
  }, []);

  const loadFeedbackHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8a3aee84/my-feedback`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${currentSession.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Load feedback history failed:', data);
        throw new Error(data.error || 'Failed to load feedback history');
      }

      const sortedFeedback = (data.feedback || []).sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setFeedbackHistory(sortedFeedback);
    } catch (err: any) {
      console.error('Load feedback history error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setMessage(null);

    try {
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8a3aee84/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${currentSession.access_token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Upload failed with status:', response.status, 'Data:', data);
        throw new Error(data.error || 'Upload failed');
      }

      setAttachments([...attachments, data]);
      e.target.value = '';
    } catch (err: any) {
      console.error('Upload error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to upload file' });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8a3aee84/feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentSession.access_token}`,
          },
          body: JSON.stringify({
            title,
            description,
            category,
            attachments,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Submit feedback failed with status:', response.status, 'Data:', data);
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setMessage({ type: 'success', text: 'Feedback submitted successfully!' });
      setTitle('');
      setDescription('');
      setCategory('');
      setAttachments([]);
      loadFeedbackHistory(); // Reload history to show new submission

      // Close modal after a brief delay to show success message
      setTimeout(() => {
        setModalOpen(false);
        setMessage(null);
      }, 1500);
    } catch (err: any) {
      console.error('Submit error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to submit feedback' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenModal = () => {
    setModalOpen(true);
    setMessage(null);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setMessage(null);
  };

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, mb: 0 }}>
          My Feedback History
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={handleOpenModal}
          sx={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}
        >
          Submit Feedback
        </Button>
      </Box>

      {loadingHistory ? (
        <Box className="flex items-center justify-center py-12">
          <CircularProgress />
        </Box>
      ) : feedbackHistory.length === 0 ? (
        <Card sx={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body1" color="text.secondary" align="center">
              You haven't submitted any feedback yet.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {feedbackHistory.map((feedback) => (
            <Accordion key={feedback.id} sx={{ mb: 2, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box className="flex-1">
                  <Box className="flex items-center gap-2 mb-1 flex-wrap">
                    <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      {feedback.title}
                    </Typography>
                    <Chip
                      label={feedback.category}
                      size="small"
                      color={getCategoryColor(feedback.category)}
                      sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
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
                      sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Submitted on {new Date(feedback.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: { xs: 2, sm: 3 } }}>
                <Grid container spacing={3}>
                  <Grid size={12}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      Description:
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      {feedback.description}
                    </Typography>
                  </Grid>

                  {feedback.attachments && feedback.attachments.length > 0 && (
                    <Grid size={12}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Attachments ({feedback.attachments.length}):
                      </Typography>
                      <Box className="flex flex-col gap-2">
                        {feedback.attachments.map((attachment: any, index: number) => (
                          <Box key={index} className="flex items-center gap-2">
                            <AttachFileIcon fontSize="small" />
                            <Link
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, wordBreak: 'break-word' }}
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
                          p: { xs: 1.5, sm: 2 },
                          borderRadius: 2,
                          backgroundColor: feedback.status === 'accepted'
                            ? 'success.main'
                            : feedback.status === 'declined'
                            ? 'error.main'
                            : 'warning.main',
                          color: 'white',
                          opacity: 0.9,
                        }}
                      >
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                          Admin Response:
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                          {feedback.adminComment}
                        </Typography>
                        {feedback.reviewedBy && (
                          <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.9, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                            — {feedback.reviewedBy}, {new Date(feedback.reviewedAt).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  )}

                  {feedback.reviewedBy && !feedback.adminComment && (
                    <Grid size={12}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                        Reviewed by {feedback.reviewedBy} on{' '}
                        {new Date(feedback.reviewedAt).toLocaleString()}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          },
        }}
      >
        <DialogTitle>Submit Feedback</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              label="Feedback Title"
              fullWidth
              required
              margin="normal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of your feedback"
            />

            <FormControl fullWidth required margin="normal">
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Description"
              fullWidth
              required
              multiline
              rows={6}
              margin="normal"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed feedback here..."
            />

            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Attachments
              </Typography>

              <Button
                variant="outlined"
                component="label"
                startIcon={uploading ? <CircularProgress size={20} /> : <AttachFileIcon />}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Add Attachment'}
                <input
                  type="file"
                  hidden
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
              </Button>

              {attachments.length > 0 && (
                <Paper variant="outlined" sx={{ mt: 2, backdropFilter: 'blur(10px)' }}>
                  <List>
                    {attachments.map((attachment, index) => (
                      <ListItem
                        key={index}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveAttachment(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={attachment.fileName}
                          secondary={`Uploaded on ${new Date().toLocaleDateString()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>

            {message && (
              <Alert severity={message.type} sx={{ mt: 2 }}>
                {message.text}
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseModal} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Fab
        color="primary"
        aria-label="add feedback"
        onClick={handleOpenModal}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          display: { xs: 'flex', sm: 'none' },
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}
