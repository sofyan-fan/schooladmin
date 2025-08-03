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

const {
  create_assessment,
  get_all_assessments,
  get_assessment_by_id,
  update_assessment,
  delete_assessment,
} = require('../controllers/general/assessment');

const {
  create_absence,
  get_all_absences,
  get_absence_by_id,
  update_absence,
  delete_absence,
} = require('../controllers/general/absence');

const {
  get_all_courses,
  get_course_by_id,
  create_course,
  update_course,
  delete_course,
} = require('../controllers/general/course');

// Courses routes
router.get('/courses', get_all_courses);
router.get('/courses/:id', get_course_by_id);
router.post('/courses', create_course);
router.put('/courses/:id', update_course);
router.delete('/courses/:id', delete_course);

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

// Assessments routes
router.post('/assessments', create_assessment);
router.get('/assessments', get_all_assessments);
router.get('/assessments/:id', get_assessment_by_id);
router.put('/assessments/:id', update_assessment);
router.delete('/assessments/:id', delete_assessment);

// Absences routes
router.post('/absences', create_absence);
router.get('/absences', get_all_absences);
router.get('/absences/:id', get_absence_by_id);
router.put('/absences/:id', update_absence);
router.delete('/absences/:id', delete_absence);

module.exports = router;