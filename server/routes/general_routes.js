const express = require('express');
const router = express.Router();

const {
  get_all_students,
  get_student_by_id,
  search_students,
} = require('../controllers/general/user_document');

const {
  create_subject,
  get_subjects,
  get_subject_by_id,
  update_subject,
  delete_subject,
} = require('../controllers/general/subject');

// Students routes
router.get('/get_students', get_all_students);
router.get('/get_student/:id', get_student_by_id);
router.get('/search_student', search_students);

// Subjects routes
router.post('/subjects', create_subject);
router.get('/subjects', get_subjects);
router.get('/subjects/:id', get_subject_by_id);
router.put('/subjects/:id', update_subject);
router.delete('/subjects/:id', delete_subject);

module.exports = router;