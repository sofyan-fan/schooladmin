const express = require('express');
const router = express.Router();

const {
  get_all_students,
  get_student_by_id,
  search_students,
} = require('../controllers/general/user_document');

// Students routes
router.get('/get_students', get_all_students);
router.get('/get_student/:id', get_student_by_id);
router.get('/search_student', search_students);

// Subjects routes
router.post('/subjects', subjectController.create_subject);
router.get('/subjects', subjectController.get_subjects);
router.get('/subjects/:id', subjectController.get_subject_by_id);
router.put('/subjects/:id', subjectController.update_subject);
router.delete('/subjects/:id', subjectController.delete_subject);

module.exports = router;