const express = require('express');
const router = express.Router();

const authenticate = require('./middleware/authenticate');
const { login, logout } = require('./controllers/auth/login');
const { get_user, get_users } = require('./controllers/auth/user');
const { register } = require('./controllers/auth/register');
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
} = require('./controllers/user_document');

// Auth routes
router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.post('/auth/register', register);
router.get('/auth/me', authenticate, get_user);

// User routes
router.get('/users', authenticate, get_users);

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
