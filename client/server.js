import cors from 'cors';
import fs from 'fs';
import jsonServer from 'json-server';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

// Allow frontend at 5173 and credentials like the real backend
server.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Route rewrites so the client can call real-backend-like paths
const routes = JSON.parse(fs.readFileSync(path.join(__dirname, 'routes.json')));
const rewriter = jsonServer.rewriter(routes);
server.use(rewriter);

// Helpers
const db = router.db; // Lowdb instance

function toSnakeCaseProfile(payload) {
  if (!payload || typeof payload !== 'object') return {};
  return {
    first_name: payload.first_name ?? payload.firstName ?? '',
    last_name: payload.last_name ?? payload.lastName ?? '',
    birth_date: payload.birth_date ?? payload.dateOfBirth ?? '',
    gender: payload.gender ?? '',
    address: payload.address ?? '',
    postal_code: payload.postal_code ?? payload.postalCode ?? '',
    city: payload.city ?? '',
    phone: payload.phone ?? '',
    parent_name: payload.parent_name ?? payload.parentName ?? '',
    parent_email: payload.parent_email ?? payload.parentEmail ?? '',
    lesson_package: payload.lesson_package ?? payload.lessonPackage ?? '',
    payment_method: payload.payment_method ?? payload.paymentMethod ?? '',
  };
}

// POST /auth/register — mimic real backend

server.post('/auth/register', (req, res) => {
  try {
    const {
      email,
      password,
      role,
      // accept both snake_case and camelCase profile fields
      ...rest
    } = req.body || {};

    if (!email || !password || !role) {
      return res.status(400).json({
        message: 'Email, password, and role are required.',
      });
    }

    const normalizedRole = String(role).toLowerCase();
    if (!['student', 'teacher'].includes(normalizedRole)) {
      return res.status(400).json({
        message: 'Role must be either "student" or "teacher".',
      });
    }

    const existing = db.get('users').find({ email }).value();
    if (existing) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const nextUserId = (db.get('users').map('id').max().value() || 0) + 1;
    const user = { id: nextUserId, email, password, role: normalizedRole };
    db.get('users').push(user).write();

    let profile = null;
    const profileBase = toSnakeCaseProfile(rest);

    if (normalizedRole === 'teacher') {
      const nextTeacherId =
        (db.get('teachers').map('id').max().value() || 0) + 1;
      profile = {
        id: nextTeacherId,
        email,
        is_active: true,
        user_id: user.id,
        ...profileBase,
      };
      db.get('teachers').push(profile).write();
    } else {
      // student
      if (!profileBase.birth_date) {
        return res
          .status(400)
          .json({ message: 'Birth date is required for students.' });
      }
      const nextStudentId =
        (db.get('students').map('id').max().value() || 0) + 1;
      profile = {
        id: nextStudentId,
        enrollment_status: true,
        user_id: user.id,
        ...profileBase,
      };
      db.get('students').push(profile).write();
    }

    // Mimic session-based response from real backend
    return res.status(201).json({
      accessToken: 'session',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        data: profile,
      },
    });
  } catch (err) {
    console.error('Mock /auth/register error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// POST /auth/login — mimic real backend shape
server.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.get('users').find({ email, password }).value();
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const session = { id: `mock-session-${user.id}` };
  const minimalUser = {
    id: user.id,
    email: user.email,
    firstname: user.firstname || '',
    lastname: user.lastname || '',
  };
  return res.status(200).json({
    message: 'Login successful',
    user: minimalUser,
    session,
  });
});

server.post('/auth/logout', (_req, res) => {
  return res.status(200).json({ message: 'Logout successful' });
});

// GET /auth/users — list users
server.get('/auth/users', (_req, res) => {
  const users = db
    .get('users')
    .value()
    .map(({ password: _password, ...u }) => u);
  res.status(200).json(users);
});

// PUT /auth/students/:student_id/enrollment — update enrollment_status
server.put('/auth/students/:student_id/enrollment', (req, res) => {
  const studentId = Number(req.params.student_id);
  const { enrollment_status } = req.body || {};
  const student = db.get('students').find({ id: studentId }).value();
  if (!student) return res.status(404).json({ message: 'Not found' });
  const updated = { ...student, enrollment_status: Boolean(enrollment_status) };
  db.get('students').find({ id: studentId }).assign(updated).write();
  res.status(200).json({
    message: 'Enrollment status updated successfully',
    student: updated,
  });
});

// Fallback to default router for standard CRUD (events, subjects, students, etc.)
server.use(router);

const port = 8000;
server.listen(port, () => {
  console.log(`Mock API (json-server) running on http://localhost:${port}`);
});
