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

const app = express();


const PORT = process.env.PORT || 3000;


app.set('trust proxy', 1);


const allowedOrigins = ['http://localhost:5173', /\.vercel\.app$/];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); 
      const ok = allowedOrigins.some((o) =>
        o.test ? o.test(origin) : o === origin
      );
      return cb(ok ? null : new Error('Not allowed by CORS'), ok);
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


app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-only-secret-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  })
);


app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/', routes);

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}.`);
});