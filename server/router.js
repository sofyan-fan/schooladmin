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
router.get('/auth/me', get_user);

// User routes
router.get('/users', get_users);

// Dashboard route
router.get('/dashboard', get_dashboard_data);

// Event routes
router.get('/events', get_events);
router.post('/events', create_event);
router.put('/events/:id', edit_event);
router.delete('/events/:id', delete_event);

// Student routes
router.get('/students', get_all_students);
router.get('/students/search', search_students);
router.get('/students/:id', get_student_by_id);

module.exports = router;
