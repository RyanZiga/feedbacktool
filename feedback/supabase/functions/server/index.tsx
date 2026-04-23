import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize Supabase storage bucket for attachments
const initStorage = async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const bucketName = 'make-8a3aee84-feedback-attachments';
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

  if (!bucketExists) {
    await supabase.storage.createBucket(bucketName, { public: false });
    console.log('Created feedback attachments bucket');
  }
};

// Initialize storage on startup
initStorage().catch(console.error);

// Health check endpoint
app.get("/make-server-8a3aee84/health", (c) => {
  return c.json({ status: "ok" });
});

// Signup endpoint - creates new user with role (student or admin)
app.post("/make-server-8a3aee84/signup", async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();

    if (!email || !password || !name || !role) {
      return c.json({ error: 'Missing required fields: email, password, name, role' }, 400);
    }

    if (role !== 'student' && role !== 'admin') {
      return c.json({ error: 'Role must be either "student" or "admin"' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Signup error for ${email}: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({
      message: 'User created successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        name,
        role
      }
    });
  } catch (error) {
    console.log(`Error during signup: ${error}`);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

// Submit feedback endpoint (students only)
app.post("/make-server-8a3aee84/feedback", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'Unauthorized - no access token provided' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Validate token by passing it directly to getUser
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.log(`Auth error while submitting feedback: ${authError?.message}, Code: ${authError?.code}`);
      return c.json({ error: authError?.message || 'Unauthorized - invalid token', code: authError?.code }, 401);
    }

    const role = user.user_metadata?.role;
    if (role !== 'student') {
      return c.json({ error: 'Only students can submit feedback' }, 403);
    }

    const { title, description, attachments, category } = await c.req.json();

    if (!title || !description || !category) {
      return c.json({ error: 'Missing required fields: title, description, category' }, 400);
    }

    const validCategories = ['Bug Report', 'Feature Request', 'Question', 'Complaint', 'Suggestion'];
    if (!validCategories.includes(category)) {
      return c.json({ error: 'Invalid category. Must be one of: Bug Report, Feature Request, Question, Complaint, Suggestion' }, 400);
    }

    const feedbackId = crypto.randomUUID();
    const feedback = {
      id: feedbackId,
      studentId: user.id,
      studentName: user.user_metadata?.name,
      studentEmail: user.email,
      title,
      description,
      category,
      attachments: attachments || [],
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await kv.set(`feedback:${feedbackId}`, feedback);

    return c.json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    console.log(`Error submitting feedback: ${error}`);
    return c.json({ error: 'Internal server error while submitting feedback' }, 500);
  }
});

// Get all feedback endpoint (admin only)
app.get("/make-server-8a3aee84/feedback", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'Unauthorized - no access token provided' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Validate token by passing it directly to getUser
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.log(`Auth error while fetching feedback: ${authError?.message}, Code: ${authError?.code}`);
      return c.json({ error: authError?.message || 'Unauthorized - invalid token', code: authError?.code }, 401);
    }

    const role = user.user_metadata?.role;
    if (role !== 'admin') {
      return c.json({ error: 'Only admins can view all feedback' }, 403);
    }

    const feedbackList = await kv.getByPrefix('feedback:');

    return c.json({ feedback: feedbackList });
  } catch (error) {
    console.log(`Error fetching feedback: ${error}`);
    return c.json({ error: 'Internal server error while fetching feedback' }, 500);
  }
});

// Update feedback status endpoint (admin only)
app.put("/make-server-8a3aee84/feedback/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'Unauthorized - no access token provided' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.log(`Auth error while updating feedback: ${authError?.message}`);
      return c.json({ error: 'Unauthorized - invalid token' }, 401);
    }

    const role = user.user_metadata?.role;
    if (role !== 'admin') {
      return c.json({ error: 'Only admins can update feedback status' }, 403);
    }

    const feedbackId = c.req.param('id');
    const { status, adminComment } = await c.req.json();

    if (!status || !['pending', 'accepted', 'declined'].includes(status)) {
      return c.json({ error: 'Invalid status. Must be: pending, accepted, or declined' }, 400);
    }

    const feedback = await kv.get(`feedback:${feedbackId}`);

    if (!feedback) {
      return c.json({ error: 'Feedback not found' }, 404);
    }

    const updatedFeedback = {
      ...feedback,
      status,
      adminComment: adminComment || '',
      reviewedBy: user.user_metadata?.name,
      reviewedAt: new Date().toISOString()
    };

    await kv.set(`feedback:${feedbackId}`, updatedFeedback);

    return c.json({ message: 'Feedback status updated successfully', feedback: updatedFeedback });
  } catch (error) {
    console.log(`Error updating feedback status: ${error}`);
    return c.json({ error: 'Internal server error while updating feedback status' }, 500);
  }
});

// Get student's own feedback submissions
app.get("/make-server-8a3aee84/my-feedback", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'Unauthorized - no access token provided' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.log(`Auth error while fetching student feedback: ${authError?.message}`);
      return c.json({ error: 'Unauthorized - invalid token' }, 401);
    }

    const allFeedback = await kv.getByPrefix('feedback:');
    const studentFeedback = allFeedback.filter((fb: any) => fb.studentId === user.id);

    return c.json({ feedback: studentFeedback });
  } catch (error) {
    console.log(`Error fetching student feedback: ${error}`);
    return c.json({ error: 'Internal server error while fetching student feedback' }, 500);
  }
});

// Upload attachment endpoint
app.post("/make-server-8a3aee84/upload", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: 'Unauthorized - no access token provided' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Validate token by passing it directly to getUser
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized - invalid token' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const fileName = `${user.id}/${Date.now()}_${file.name}`;
    const bucketName = 'make-8a3aee84-feedback-attachments';

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, await file.arrayBuffer(), {
        contentType: file.type,
      });

    if (error) {
      console.log(`Upload error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    const { data: signedUrlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 60 * 60 * 24 * 365);

    return c.json({
      fileName: file.name,
      path: fileName,
      url: signedUrlData?.signedUrl
    });
  } catch (error) {
    console.log(`Error uploading file: ${error}`);
    return c.json({ error: 'Internal server error during upload' }, 500);
  }
});

Deno.serve(app.fetch);