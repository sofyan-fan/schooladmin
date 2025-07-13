const express = require('express');
const router = express.Router();

// Import middleware
const authenticate = require('./middleware/authenticate');

// Import controllers
const { login } = require('./controllers/auth/login');
const { logout } = require('./controllers/auth/logout'); // Import logout
const { getMe } = require('./controllers/auth/me'); // Import getMe
const { register } = require('./controllers/auth/register'); // Import register
const { get_dashboard_data } = require('./controllers/dashboard');
const {
  get_events,
  create_event,
  delete_event,
  edit_event,
} = require('./controllers/event');
const {
  get_all_students,
  get_student_by_id,
  search_students,
} = require('./controllers/leerlingenbestand');
const { getUsers } = require('./controllers/user');

// Auth routes
router.post('/auth/login', login);
router.post('/auth/logout', logout); // Add logout route
router.post('/auth/register', register);
router.get('/auth/me', authenticate, getMe);

// User routes
router.get('/users', authenticate, getUsers);

// Dashboard route
router.get('/dashboard', authenticate, get_dashboard_data);

// Event routes
router.get('/events', authenticate, get_events);
router.post('/events', authenticate, create_event);
router.put('/events/:id', authenticate, edit_event);
router.delete('/events/:id', authenticate, delete_event);

// Student routes
router.get('/students', authenticate, get_all_students);
router.get('/students/search', authenticate, search_students);
router.get('/students/:id', authenticate, get_student_by_id);

module.exports = router;
