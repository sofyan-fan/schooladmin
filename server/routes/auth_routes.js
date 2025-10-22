const express = require('express');
const router = express.Router();

const { login, logout } = require('../controllers/auth/login');
const {
  get_user,
  get_users,
  update_enrollment,
  get_current_student,
} = require('../controllers/auth/user');
const { register } = require('../controllers/auth/register');

// Auth routes
router.post('/login', login);
router.post('/logout', logout);
router.post('/register', register);
router.get('/me', get_user);
router.get('/me/student', get_current_student);
router.get('/users', get_users);

// Update enrollment status for a specific student
router.put('/students/:student_id/enrollment', update_enrollment);

module.exports = router;
