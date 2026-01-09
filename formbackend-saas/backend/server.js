require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('./database');
const emailService = require('./emailService');
const stripeService = require('./stripeService');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use('/api/', limiter);

// Submission rate limit (more restrictive)
const submissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Check submission limits based on tier
function checkSubmissionLimit(userId) {
  const user = db.prepare('SELECT subscription_tier, monthly_submissions FROM users WHERE id = ?').get(userId);

  const limits = {
    free: 50,
    pro: 1000,
    business: Infinity
  };

  const limit = limits[user.subscription_tier] || limits.free;
  return user.monthly_submissions < limit;
}

// Reset monthly submissions (call this monthly via cron)
function resetMonthlySubmissions() {
  db.prepare('UPDATE users SET monthly_submissions = 0').run();
}

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = db.prepare(
      'INSERT INTO users (email, password) VALUES (?, ?)'
    ).run(email, hashedPassword);

    const userId = result.lastInsertRowid;

    // Generate API key
    const apiKey = `fbk_${uuidv4().replace(/-/g, '')}`;
    db.prepare('INSERT INTO api_keys (user_id, key_value) VALUES (?, ?)').run(userId, apiKey);

    // Generate JWT
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: { id: userId, email, subscription_tier: 'free' },
      apiKey
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', [
  body('email').isEmail(),
  body('password').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        subscription_tier: user.subscription_tier,
        monthly_submissions: user.monthly_submissions
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ==================== USER ROUTES ====================

// Get user profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, email, subscription_tier, subscription_status, monthly_submissions, created_at FROM users WHERE id = ?'
    ).get(req.user.id);

    const apiKey = db.prepare('SELECT key_value FROM api_keys WHERE user_id = ?').get(req.user.id);

    res.json({
      user,
      apiKey: apiKey?.key_value
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Regenerate API key
app.post('/api/user/regenerate-key', authenticateToken, (req, res) => {
  try {
    const newApiKey = `fbk_${uuidv4().replace(/-/g, '')}`;

    db.prepare('DELETE FROM api_keys WHERE user_id = ?').run(req.user.id);
    db.prepare('INSERT INTO api_keys (user_id, key_value) VALUES (?, ?)').run(req.user.id, newApiKey);

    res.json({ apiKey: newApiKey });
  } catch (error) {
    console.error('Key regeneration error:', error);
    res.status(500).json({ error: 'Failed to regenerate key' });
  }
});

// ==================== FORM ROUTES ====================

// Create form
app.post('/api/forms', authenticateToken, [
  body('name').notEmpty(),
  body('notification_email').optional().isEmail()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, redirect_url, notification_email } = req.body;
  const formKey = uuidv4();

  try {
    const result = db.prepare(
      'INSERT INTO forms (user_id, name, form_key, redirect_url, notification_email) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user.id, name, formKey, redirect_url || null, notification_email || null);

    res.json({
      id: result.lastInsertRowid,
      name,
      form_key: formKey,
      redirect_url,
      notification_email
    });
  } catch (error) {
    console.error('Form creation error:', error);
    res.status(500).json({ error: 'Failed to create form' });
  }
});

// Get all forms for user
app.get('/api/forms', authenticateToken, (req, res) => {
  try {
    const forms = db.prepare(
      'SELECT id, name, form_key, redirect_url, notification_email, created_at FROM forms WHERE user_id = ?'
    ).all(req.user.id);

    // Get submission counts
    const formsWithCounts = forms.map(form => {
      const count = db.prepare('SELECT COUNT(*) as count FROM submissions WHERE form_id = ?').get(form.id);
      return { ...form, submission_count: count.count };
    });

    res.json(formsWithCounts);
  } catch (error) {
    console.error('Forms fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

// Get single form
app.get('/api/forms/:id', authenticateToken, (req, res) => {
  try {
    const form = db.prepare(
      'SELECT * FROM forms WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json(form);
  } catch (error) {
    console.error('Form fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch form' });
  }
});

// Update form
app.put('/api/forms/:id', authenticateToken, (req, res) => {
  const { name, redirect_url, notification_email } = req.body;

  try {
    db.prepare(
      'UPDATE forms SET name = ?, redirect_url = ?, notification_email = ? WHERE id = ? AND user_id = ?'
    ).run(name, redirect_url || null, notification_email || null, req.params.id, req.user.id);

    res.json({ success: true });
  } catch (error) {
    console.error('Form update error:', error);
    res.status(500).json({ error: 'Failed to update form' });
  }
});

// Delete form
app.delete('/api/forms/:id', authenticateToken, (req, res) => {
  try {
    // Delete submissions first
    db.prepare('DELETE FROM submissions WHERE form_id = ?').run(req.params.id);

    // Delete form
    db.prepare('DELETE FROM forms WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);

    res.json({ success: true });
  } catch (error) {
    console.error('Form deletion error:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

// ==================== SUBMISSION ROUTES ====================

// Submit form (PUBLIC ENDPOINT)
app.post('/submit/:formKey', submissionLimiter, async (req, res) => {
  const { formKey } = req.params;

  try {
    // Find form
    const form = db.prepare('SELECT * FROM forms WHERE form_key = ?').get(formKey);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Get user and check limits
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(form.user_id);

    if (!checkSubmissionLimit(form.user_id)) {
      return res.status(429).json({ error: 'Submission limit reached for this form' });
    }

    // Store submission
    const submissionData = JSON.stringify(req.body);
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    db.prepare(
      'INSERT INTO submissions (form_id, data, ip_address, user_agent) VALUES (?, ?, ?, ?)'
    ).run(form.id, submissionData, ipAddress, userAgent);

    // Increment user's monthly submission count
    db.prepare('UPDATE users SET monthly_submissions = monthly_submissions + 1 WHERE id = ?').run(form.user_id);

    // Send email notification if configured
    if (form.notification_email) {
      await emailService.sendSubmissionNotification(form.notification_email, form.name, req.body);
    }

    // Return response
    if (form.redirect_url) {
      res.json({ success: true, redirect: form.redirect_url });
    } else {
      res.json({ success: true, message: 'Form submitted successfully' });
    }
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ error: 'Submission failed' });
  }
});

// Get submissions for a form
app.get('/api/forms/:id/submissions', authenticateToken, (req, res) => {
  try {
    // Verify form belongs to user
    const form = db.prepare('SELECT id FROM forms WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const submissions = db.prepare(
      'SELECT id, data, ip_address, created_at FROM submissions WHERE form_id = ? ORDER BY created_at DESC LIMIT 1000'
    ).all(req.params.id);

    // Parse JSON data
    const parsedSubmissions = submissions.map(sub => ({
      ...sub,
      data: JSON.parse(sub.data)
    }));

    res.json(parsedSubmissions);
  } catch (error) {
    console.error('Submissions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// ==================== PAYMENT ROUTES ====================

// Create checkout session
app.post('/api/create-checkout-session', authenticateToken, async (req, res) => {
  const { tier } = req.body; // 'pro' or 'business'

  try {
    const session = await stripeService.createCheckoutSession(req.user.id, req.user.email, tier);
    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook
app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    await stripeService.handleWebhook(req, res);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook failed' });
  }
});

// Create portal session (for managing subscription)
app.post('/api/create-portal-session', authenticateToken, async (req, res) => {
  try {
    const user = db.prepare('SELECT stripe_customer_id FROM users WHERE id = ?').get(req.user.id);

    if (!user.stripe_customer_id) {
      return res.status(400).json({ error: 'No subscription found' });
    }

    const session = await stripeService.createPortalSession(user.stripe_customer_id);
    res.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// ==================== STATS ROUTES ====================

app.get('/api/stats', authenticateToken, (req, res) => {
  try {
    const formCount = db.prepare('SELECT COUNT(*) as count FROM forms WHERE user_id = ?').get(req.user.id);
    const totalSubmissions = db.prepare(
      'SELECT COUNT(*) as count FROM submissions WHERE form_id IN (SELECT id FROM forms WHERE user_id = ?)'
    ).get(req.user.id);
    const user = db.prepare('SELECT monthly_submissions, subscription_tier FROM users WHERE id = ?').get(req.user.id);

    res.json({
      forms: formCount.count,
      total_submissions: totalSubmissions.count,
      monthly_submissions: user.monthly_submissions,
      subscription_tier: user.subscription_tier
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`FormBackend API running on port ${PORT}`);
  console.log(`Server accessible at http://0.0.0.0:${PORT}`);
});

// Export for testing
module.exports = app;
