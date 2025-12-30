const express = require('express');
const router = express.Router();

const { login, logout } = require('../controllers/auth/login');
const {
  get_user,
  get_users,
  update_enrollment,
  get_current_student,
  get_current_teacher,
  update_current_student_contact,
  update_current_teacher_contact,
} = require('../controllers/auth/user');
const { register } = require('../controllers/auth/register');

// Auth routes
router.post('/login', login);
router.post('/logout', logout);
router.post('/register', register);
router.get('/me', get_user);
router.get('/me/student', get_current_student);
router.get('/me/teacher', get_current_teacher);
router.get('/users', get_users);

// Self-service account settings (contact info only; no password changes)
router.put('/me/student/contact', update_current_student_contact);
router.put('/me/teacher/contact', update_current_teacher_contact);

// Update enrollment status for a specific student
router.put('/students/:student_id/enrollment', update_enrollment);

module.exports = router;
