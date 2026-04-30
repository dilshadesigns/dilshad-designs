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
  : [
      'http://localhost:3000',
      'https://dilshadesigns.vercel.app',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
    ];

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

// Rate limiting — 30 chat messages per IP per 10 minutes
const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: { error: 'Too many messages. Please wait a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Knowledge Base ────────────────────────────────────────────────────────────
// Injected into the AI system prompt so it always has accurate info

const DILSHAD_KNOWLEDGE = `
SERVICES & PRICING HINTS:
- Zoho Consulting & Implementation: Zoho One, CRM, Desk, Books, Creator, Campaign, Analytics, People, Recruit, Booking. Setup, configuration, third-party integrations, BI/reporting.
- Branding & Identity Design: Logo design, brand style guide, business card design.
- Custom Website Development: Responsive websites, portfolio sites, business sites, SEO-optimized, fast-loading.
- Marketing & Advertising Design: Posters, flyers, brochures, banner ads.
- Motion Graphics: Intros/outros, animated social media posts, video title graphics.
- High-Converting Landing Pages: Lead generation pages, product launch pages, CTA-focused layouts.
- Packaging Design: Product packaging, label design, retail & food packaging.
- Social Media Design: Instagram posts/stories, Facebook ads/covers, YouTube thumbnails/banners.
- UI/UX Design: App & web UI, wireframes & prototypes, user flow design.
- Merchandise Design: T-shirt graphics, mugs, badges, keychains, event tickets.

CONTACT & HIRING:
- Fiverr: fiverr.com/dilshadesigns (preferred — secure payment, verified reviews)
- Email: dilshadesign.co@gmail.com
- Phone: +91 11499 53616
- Instagram: @dilshadesigns
- LinkedIn: linkedin.com/in/dilshadesigns/
- Location: New Delhi, India (works globally, all online)
- Response time: typically within 2–4 hours

STATS:
- 2+ years experience
- 50+ projects delivered
- 5-star Fiverr rating
- 100% client satisfaction

TURNAROUND:
- Social media posts: 24 hours
- Posters/banners: 24–48 hours
- Logo/branding: 1–3 days
- Brand identity full package: 3–5 days
- Landing pages: 3–7 days
- Websites: 5–14 days depending on scope
- Rush delivery available on request

REVISIONS: Unlimited revisions until 100% client satisfaction. No extra charges for reasonable requests.

PRICING: Custom per project. Clients can get quotes via Fiverr gigs or the contact form. Pricing is competitive and tailored to scope.

FILE FORMATS DELIVERED: PDF, PNG, JPG, SVG, AI, PSD — both print-ready and web-ready.
`;

const SYSTEM_PROMPT = `You are the AI assistant for Dilshad Designs, a premium freelance graphic design and web development studio based in New Delhi, India. You represent Dilshad — a passionate, top-rated creative professional.

YOUR PERSONALITY:
- Warm, friendly, and enthusiastic — like a knowledgeable friend, not a cold bot
- Professional but conversational. Use light emojis naturally (not excessively)
- Confident in Dilshad's quality and results
- Sales-aware: your goal is to help visitors understand value and move toward hiring

YOUR MISSION:
- Help visitors understand Dilshad's services
- Answer questions accurately using the knowledge below
- Guide interested visitors toward hiring (Fiverr or contact form)
- Convert curiosity into clients

BEHAVIOR RULES:
1. Always be helpful and specific — never vague
2. For pricing questions: explain that pricing is custom/project-based, give ballpark hints if asked, and always direct to Fiverr or the contact form for exact quotes
3. For irrelevant questions (sports, politics, general trivia): politely redirect — "That's a bit outside my zone! I'm here to help you with Dilshad's design services. What can I help you with?"
4. Never invent services, prices, or capabilities not listed in the knowledge base
5. When someone seems interested, naturally suggest the next step: "Want to get started? You can place an order on Fiverr or send a message through the contact form!"
6. Keep responses concise (2–5 sentences typically). For service lists, use short bullet points
7. Do NOT use markdown bold (**text**) — use plain text or short bullet points only
8. If asked about turnaround/delivery, give specific timeframes from the knowledge base
9. Be encouraging and positive about every project type

${DILSHAD_KNOWLEDGE}

Remember: You are the first impression many clients will have. Make every interaction count.`;

// ─── Hybrid Response (Rule-based first, AI for complex queries) ────────────────

const QUICK_RESPONSES = {
  fiverr: {
    patterns: ['fiverr', 'order', 'hire', 'book', 'purchase', 'buy'],
    response: "You can hire Dilshad directly on Fiverr! 🌟\n\nVisit: fiverr.com/dilshadesigns\n\nFiverr gives you:\n• Secure payment protection\n• Verified 5-star reviews\n• Satisfaction guarantee\n\nJust click the 'Hire on Fiverr' button at the top of the page!"
  },
  contact: {
    patterns: ['email', 'phone', 'number', 'whatsapp', 'reach', 'contact directly'],
    response: "Here's how to reach Dilshad directly:\n\n📧 dilshadesign.co@gmail.com\n📱 +91 11499 53616\n📸 @dilshadesigns (Instagram)\n💼 linkedin.com/in/dilshadesigns/\n\nOr use the Contact form on this page — Dilshad typically responds within 2–4 hours!"
  },
  revisions: {
    patterns: ['revision', 'change', 'redo', 'unlimited revision'],
    response: "Yes — unlimited revisions are included! 🔄\n\nDilshad works until you're 100% satisfied. No extra charges for reasonable revision requests. Your satisfaction is the only goal."
  },
};

function getQuickResponse(message) {
  const lower = message.toLowerCase();
  for (const key of Object.keys(QUICK_RESPONSES)) {
    const { patterns, response } = QUICK_RESPONSES[key];
    if (patterns.some(p => lower.includes(p))) {
      return response;
    }
  }
  return null;
}

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

// ─── /api/chat — Main AI Endpoint ─────────────────────────────────────────────

app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    // Input validation
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }
    if (message.trim().length > 500) {
      return res.status(400).json({ error: 'Message too long (max 500 characters).' });
    }

    // Check API key
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'AI service not configured.' });
    }

    // Hybrid: try quick response first for common queries
    const quickReply = getQuickResponse(message.trim());
    if (quickReply) {
      return res.json({ reply: quickReply, source: 'quick' });
    }

    // Build conversation history for OpenRouter (max last 10 messages for context)
    const recentHistory = Array.isArray(history) ? history.slice(-10) : [];
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentHistory.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message.trim() },
    ];

    // Call OpenRouter API
    const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://dilshadesigns.vercel.app',
        'X-Title': 'Dilshad Designs Chatbot',
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'mistralai/mistral-7b-instruct:free',
        messages,
        max_tokens: 400,
        temperature: 0.7,
        top_p: 0.9,
      }),
    });

    if (!openRouterRes.ok) {
      const errBody = await openRouterRes.text();
      console.error('OpenRouter error:', openRouterRes.status, errBody);
      throw new Error(`OpenRouter API error: ${openRouterRes.status}`);
    }

    const data = await openRouterRes.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      throw new Error('Empty response from AI');
    }

    res.json({ reply, source: 'ai' });

  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({
      error: 'Something went wrong. Please try again!',
      // Fallback response so chatbot never dies
      reply: "I'm having a little trouble right now, but Dilshad is always available directly! 😊\n\nYou can:\n• Email: dilshadesign.co@gmail.com\n• Visit Fiverr: fiverr.com/dilshadesigns\n• Use the Contact form on this page",
    });
  }
});

// ─── /api/contact/lead — Lead Capture ─────────────────────────────────────────

app.post('/api/contact/lead', contactLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email.' });
    }

    console.log('🎯 Lead captured:', email);
    // TODO: Add to your CRM / email list here

    res.json({ success: true });

  } catch (err) {
    console.error('Lead capture error:', err);
    res.status(500).json({ message: 'Error capturing lead.' });
  }
});

// ─── Health Check ──────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiModel: process.env.AI_MODEL || 'mistralai/mistral-7b-instruct:free',
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
  console.log(`✅ Dilshad Designs backend running on port ${PORT}`);
  console.log(`🤖 AI Model: ${process.env.AI_MODEL || 'mistralai/mistral-7b-instruct:free'}`);
});

module.exports = app;