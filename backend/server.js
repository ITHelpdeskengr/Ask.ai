require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const connectDB = require('./config/db');
const backgroundService = require('./services/backgroundService');
const driveSync = require('./services/driveSync');
const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
// crossOriginOpenerPolicy must be 'same-origin-allow-popups' (not the default 'same-origin')
// so the Google Sign-In popup at accounts.google.com can post credentials back to this page.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
}));

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.RENDER_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(null, true); // Allow all in dev — tighten for prod
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/email', require('./routes/email'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/gmail', require('./routes/gmail'));
app.use('/api/health', require('./routes/health'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/knowledge', require('./routes/knowledge'));

// Diagnostic route for deployment debugging
app.get('/api/debug-path', (req, res) => {
  const distPath = path.join(__dirname, '..', 'frontend', 'dist');
  res.json({
    dirname: __dirname,
    expectedDist: distPath,
    exists: fs.existsSync(distPath),
    contents: fs.existsSync(distPath) ? fs.readdirSync(distPath) : 'NOT FOUND',
    env: process.env.NODE_ENV,
    cwd: process.cwd()
  });
});
// Serve Static Assets in production
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDistPath));

// Handle React Routing - redirect all non-API routes to index.html
app.get('*', (req, res, next) => {
  // If it's an API route or file with extension, don't serve index.html
  if (req.url.startsWith('/api') || req.url.includes('.')) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Root (Fallback if UI not built yet)
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    app: process.env.APP_NAME || 'AI Chatbot',
    version: '1.0.0',
    uptime: process.uptime(),
    frontend: 'Not found in dist folder. Run build first.'
  });
});

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🤖 ${process.env.APP_NAME || 'AI Chatbot'} server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 http://localhost:${PORT}\n`);

  // Deployment Diagnostic
  const distPath = path.join(__dirname, '..', 'frontend', 'dist');
  if (fs.existsSync(distPath)) {
    console.log(`✅ Frontend dist detected at: ${distPath}`);
    if (fs.existsSync(path.join(distPath, 'index.html'))) {
      console.log('✅ index.html is ready.');
    } else {
      console.warn('❌ index.html MISSING in dist folder!');
    }
  } else {
    console.warn(`❌ Frontend dist NOT FOUND at: ${distPath}`);
    console.warn('   Make sure you ran "npm run build" from the root directory.');
  }

  backgroundService.start();

  // Schedule Google Drive Knowledge Base Sync (Every 15 minutes)
  cron.schedule('*/15 * * * *', async () => {
    console.log('[CRON] Running scheduled Google Drive Sync...');
    await driveSync.syncFolder();
  });
});

module.exports = app; // ASK.ai server ready - final branding applied
