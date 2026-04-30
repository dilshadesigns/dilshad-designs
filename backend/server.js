'use strict';

const express    = require('express');
const path       = require('path');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const morgan     = require('morgan');
const mongoose   = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const contactRouter = require('./routes/contact');
const adminRouter   = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 3000;

// ===================================================================
// CONNECT TO MONGODB
// ===================================================================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('❌ Check that MONGODB_URI is set correctly in environment variables');
  });

mongoose.connection.on('error', err => {
  console.error('❌ MongoDB runtime error:', err.message);
});

// ===================================================================
// TRUST PROXY — Required for Render / reverse proxies
// ===================================================================
app.set('trust proxy', 1);

// ===================================================================
// SECURITY HEADERS (helmet)
// ===================================================================
app.use(helmet({
  contentSecurityPolicy: false,  // disable CSP if you serve mixed content
  crossOriginEmbedderPolicy: false
}));

// ===================================================================
// CORS
// ===================================================================
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'https://dilshadesigns.vercel.app'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);      // allow server-to-server / curl
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn('[CORS] Blocked origin:', origin);
    callback(new Error('CORS: Origin not allowed — ' + origin));
  },
  methods       : ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials   : true,
}));

// ===================================================================
// GENERAL MIDDLEWARE
// ===================================================================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ===================================================================
// GLOBAL RATE LIMITING
// ===================================================================
const globalLimiter = rateLimit({
  windowMs        : 15 * 60 * 1000,
  max             : 100,
  message         : { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders : true,
  legacyHeaders   : false,
});
app.use(globalLimiter);

// Contact form — stricter limit
const contactLimiter = rateLimit({
  windowMs        : 60 * 60 * 1000,
  max             : 5,
  message         : { success: false, message: 'Too many submissions. Please try again in an hour.' },
  standardHeaders : true,
  legacyHeaders   : false,
});
app.use('/api/contact', contactLimiter);

// ===================================================================
// ROUTES
// ===================================================================
app.use('/api/contact', contactRouter);
app.use('/api/admin',   adminRouter);   // login is public; all others require JWT

app.get('/api/health', (_req, res) => {
  res.json({
    status    : 'ok',
    timestamp : new Date().toISOString(),
    database  : mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ===================================================================
// ROOT
// ===================================================================
app.get('/', (_req, res) => {
  res.json({ success: true, message: 'Dilshad Designs API is running.' });
});

// ===================================================================
// GLOBAL ERROR HANDLER
// ===================================================================
app.use((err, req, res, _next) => {
  console.error('[ERROR]', req.method, req.path, '→', err.message || err);
  const status = err.status || 500;
  res.status(status).json({
    success : false,
    // Never expose stack traces or internal messages in production
    message : process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : err.message,
  });
});

// ===================================================================
// START SERVER
// ===================================================================
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   Dilshad Designs — Backend Server   ║
  ║   Running on http://localhost:${PORT}   ║
  ║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(20)}║
  ╚══════════════════════════════════════╝
  `);
});

module.exports = app;