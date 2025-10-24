process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const routes = require('./routes');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:5173',
  /\.netlify\.app$/,
  ...FRONTEND_ORIGINS,
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);

      const ok = allowedOrigins.some((o) =>
        o instanceof RegExp ? o.test(origin) : o === origin
      );

      if (ok) return cb(null, true);
      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

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

// API routes first
app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/', routes);

// Optionally serve the client build if it exists (prod-like envs)
const candidateDirs = [
  path.join(__dirname, 'client', 'build'), // CRA-style builds if ever copied in
  path.join(__dirname, '..', 'client', 'dist'), // Vite build location
];
const staticDir = candidateDirs.find((p) => {
  try {
    return fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'));
  } catch {
    return false;
  }
});

if (staticDir) {
  app.use(express.static(staticDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}.`);
});
