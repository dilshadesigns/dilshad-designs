# Dilshad Designs — Full-Stack Project

> Freelance Graphic Designer, Web Developer & UI/UX Designer portfolio site.  
> Refactored from a single `index.html` into a clean, professional, modular full-stack architecture.

---

## 📁 Project Structure

```
dilshad-designs/
│
├── frontend/                   ← Pure HTML/CSS/JS frontend (no framework)
│   ├── index.html              ← Clean HTML (no inline styles or scripts)
│   ├── css/
│   │   └── style.css           ← All styles extracted from original <style> block
│   ├── js/
│   │   └── main.js             ← All JS extracted from original <script> blocks
│   └── assets/
│       ├── images/             ← Place hero-bg.jpg and other images here
│       ├── icons/              ← Custom icons (if any)
│       └── fonts/              ← Self-hosted fonts (if any)
│
├── backend/                    ← Node.js + Express API server
│   ├── server.js               ← Entry point — Express app, middleware, routes
│   ├── package.json            ← Backend dependencies
│   ├── .env                    ← 🔐 Secrets (NEVER commit to Git)
│   ├── routes/
│   │   └── contact.js          ← POST /api/contact route definition
│   ├── controllers/
│   │   └── contactController.js← Email send logic (Nodemailer)
│   ├── config/
│   │   └── validation.js       ← Input validation middleware
│   └── models/                 ← (Reserved for DB models if needed later)
│
├── .gitignore                  ← Git ignore rules
└── README.md                   ← This file
```

---

## ✅ What Was Refactored

| What                  | From                                          | To                                                |
| --------------------- | --------------------------------------------- | ------------------------------------------------- |
| All CSS               | `<style>` block in `index.html` (1,498 lines) | `frontend/css/style.css`                          |
| All JavaScript        | Multiple `<script>` blocks (850+ lines)       | `frontend/js/main.js`                             |
| Contact form handling | EmailJS (exposes keys in browser)             | Backend `/api/contact` via Nodemailer             |
| Sensitive keys        | Hard-coded in HTML                            | `.env` file (never sent to browser)               |
| Email obfuscation     | Cloudflare's `__cf_email__` encoding          | Plain `mailto:` links (clean)                     |
| Spam protection       | Frontend honeypot only                        | Honeypot + rate limiting + server-side validation |

### What was NOT changed (preserved 100%)

- All HTML structure, text, and content
- All CSS styles, animations, transitions, and responsive breakpoints
- All UI/UX behavior (dark mode, chatbot, lightbox, gallery slider, scroll effects)
- All SEO meta tags, Open Graph tags, Twitter Card tags
- All structured data (JSON-LD schema)
- All external links (Fiverr, Instagram, LinkedIn)
- Legal modal content (Privacy Policy & Terms of Service)

---

## 🔧 How Frontend Connects to Backend

```
User fills contact form → JS validates fields → fetch('/api/contact', { method: 'POST' })
                                                        ↓
                                              Express backend receives request
                                                        ↓
                                              Rate limiter checks IP
                                                        ↓
                                              Validation middleware (config/validation.js)
                                                        ↓
                                              contactController.sendContactEmail()
                                                        ↓
                                              Nodemailer sends 2 emails:
                                               • To owner (new enquiry notification)
                                               • To sender (auto-reply confirmation)
                                                        ↓
                                              JSON response → JS shows success/error
```

**Fallback:** If the backend returns an error (e.g., server is down), the frontend automatically falls back to EmailJS so the form never silently fails.

---

## 🚀 Running the Project Locally

### Prerequisites

- **Node.js** v16 or higher → https://nodejs.org
- A **Gmail account** with an App Password (see Step 3 below)

---

### Step 1 — Clone / Download the project

```bash
# If using Git:
git clone <your-repo-url>
cd dilshad-designs
```

---

### Step 2 — Install backend dependencies

```bash
cd backend
npm install
```

This installs: `express`, `nodemailer`, `helmet`, `cors`, `express-rate-limit`, `morgan`, `dotenv`, and `nodemon` (dev).

---

### Step 3 — Configure environment variables

Open `backend/.env` and fill in your credentials:

```env
PORT=3000
NODE_ENV=development

ALLOWED_ORIGINS=http://localhost:3000,https://dilshadesigns.vercel.app

# Gmail SMTP — use App Password, NOT your regular password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=dilshadesign.co@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx   ← Your Gmail App Password

OWNER_EMAIL=dilshadesign.co@gmail.com
```

**How to generate a Gmail App Password:**

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (required)
3. Go to **App Passwords** → Select "Mail" and "Windows Computer"
4. Copy the 16-character password into `SMTP_PASS`

---

### Step 4 — Copy your photo/image assets

Your frontend `photo/` and `gallery-cards/` folders from the original project should be copied into `frontend/`:

```
frontend/
├── photo/
│   ├── profile1.png
│   ├── about-pic-2.png
│   ├── hero-bg.jpg
│   ├── Headphone.png
│   ├── Coffee.png
│   ├── RedBull.png
│   ├── BrainMint.png
│   ├── Football.png
│   ├── Pizza.png
│   ├── Ethiglo.png
│   └── favicon (2).png
└── gallery-cards/
    ├── invoice0.png
    ├── invoice1.jpeg
    └── ... (rest of invoice images)
```

---

### Step 5 — Start the backend server

```bash
# Development (auto-restart on file changes):
cd backend
npm run dev

# Production:
npm start
```

You should see:

```
╔══════════════════════════════════════╗
║   Dilshad Designs — Backend Server   ║
║   Running on http://localhost:3000   ║
╚══════════════════════════════════════╝
```

---

### Step 6 — Open the frontend

**Option A — Open directly (no server needed for development):**

```
Open frontend/index.html directly in your browser.
```

> The contact form will use the EmailJS fallback when opened as a local file.

**Option B — Serve frontend through the backend (production-like):**

```bash
# In .env, set:
NODE_ENV=production

# Then restart:
npm start
```

Now open http://localhost:3000 — the backend serves `frontend/index.html` and all API calls work.

**Option C — Use a simple static server for frontend during development:**

```bash
cd frontend
npx serve .
# Opens at http://localhost:3000 or http://localhost:5000
```

And run backend separately on a different port.

---

## 🔐 Security Features

| Feature                 | Implementation                                    |
| ----------------------- | ------------------------------------------------- |
| CORS protection         | Only whitelisted origins can call the API         |
| HTTP security headers   | `helmet` middleware                               |
| Rate limiting (global)  | 100 req / 15 min per IP                           |
| Rate limiting (contact) | 5 submissions / hour per IP                       |
| Honeypot anti-spam      | Hidden field checked on both frontend and backend |
| Input validation        | Server-side validation for all fields             |
| Input sanitization      | HTML tags stripped, special chars escaped         |
| No secrets in frontend  | EmailJS key moved to `.env`; backend uses SMTP    |
| Body size limit         | JSON bodies capped at 10kb                        |

---

## 🌐 Deploying to Production

### Backend (Render / Railway / VPS)

1. Push to GitHub (without `.env`)
2. Set environment variables in the hosting dashboard
3. Build command: `npm install`
4. Start command: `npm start`

### Frontend (Vercel / Netlify / GitHub Pages)

- Deploy the `frontend/` folder
- Update `ALLOWED_ORIGINS` in backend `.env` to match your live domain

### Full-stack on one server (VPS / DigitalOcean)

1. Set `NODE_ENV=production` in `.env`
2. The backend serves the `frontend/` folder as static files
3. Use Nginx as a reverse proxy pointing to port 3000
4. Use PM2 to keep the Node process alive: `pm2 start server.js --name dilshad-designs`

---

## 📦 Backend Dependencies

| Package              | Purpose                             |
| -------------------- | ----------------------------------- |
| `express`            | HTTP server and routing             |
| `nodemailer`         | Send emails via SMTP                |
| `helmet`             | Secure HTTP headers                 |
| `cors`               | Cross-origin request control        |
| `express-rate-limit` | API rate limiting / spam protection |
| `morgan`             | Request logging (development)       |
| `dotenv`             | Load `.env` variables               |
| `nodemon` _(dev)_    | Auto-restart on file changes        |

---

## 📞 Support

**Dilshad Designs**  
📧 dilshadesign.co@gmail.com  
📱 +91 87507 57595
🌐 https://dilshadesigns.vercel.app
🛒 https://www.fiverr.com/dilshadesigns
