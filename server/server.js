process.on('uncaughtException', (e) => console.error('UNCAUGHT EXCEPTION:', e));
process.on('unhandledRejection', (e) =>
  console.error('UNHANDLED REJECTION:', e)
);

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const routes = require('./routes'); // your API routes
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// CORS
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:5173', // dev
  'https://school-admin.nl', // prod
  ...FRONTEND_ORIGINS,
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const ok = allowedOrigins.some((o) =>
        o instanceof RegExp ? o.test(origin) : o === origin
      );
      cb(ok ? null : new Error(`Not allowed by CORS: ${origin}`), ok);
    },
    credentials: true,
  })
);

// parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// session
const USE_SECURE_COOKIES = process.env.USE_SECURE_COOKIES === 'true';
const SESSION_SECRET =
  process.env.SESSION_SECRET || 'dev-only-secret-change-this';

app.use(
  session({
    name: 'sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      secure: USE_SECURE_COOKIES,
      sameSite: USE_SECURE_COOKIES ? 'none' : 'lax',
    },
  })
);

// API
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', routes); // << mount API under /api

// Static client (All-via-Node)
const candidates = [
  path.join(__dirname, 'client', 'dist'), // /httpdocs/server/client/dist (our deploy copy)
  path.join(__dirname, '..', 'client', 'dist'),
];
const staticDir = candidates.find((p) => {
  try {
    return fs.existsSync(path.join(p, 'index.html'));
  } catch {
    return false;
  }
});

if (staticDir) {
  app.use(express.static(staticDir));
  // SPA fallback AFTER API
  app.get('*', (_req, res) => res.sendFile(path.join(staticDir, 'index.html')));
}

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
