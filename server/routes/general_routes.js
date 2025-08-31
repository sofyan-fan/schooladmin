const express = require('express');
const router = express.Router();

const {
  get_all_students,
  get_student_by_id,
  search_students,
  create_student,
  update_student,
  delete_student,
  get_all_teachers,
  create_teacher,
  update_teacher,
  delete_teacher,
} = require('../controllers/general/user_document');

const {
  create_assessment,
  get_all_assessments,
  get_assessment_by_id,
  update_assessment,
  delete_assessment,
} = require('../controllers/general/assesment');

const {
  create_absence,
  get_all_absences,
  get_absence_by_id,
  update_absence,
  delete_absence,
  create_time_registration,
  update_time_registration,
  approve_time_registration,
  get_teacher_time_registrations,
  get_all_time_registrations
} = require('../controllers/general/time_registration');

const {
  create_classroom,
  get_classrooms,
  get_classroom,
  update_classroom,
  delete_classroom
} = require('../controllers/general/classroom');

const {
  create_result,
  get_all_results,
  get_result_by_id,
  update_result,
  delete_result
} = require('../controllers/general/results.controller');

// ==============================
// Students routes
// ==============================
router.get('/students', get_all_students);
router.get('/student/:id', get_student_by_id);
router.get('/search/student', search_students);
router.post('/student', create_student);
router.put('/student/:id', update_student);
router.delete('/student/:id', delete_student);

// ==============================
// Teachers routes
// ==============================
router.get('/teachers', get_all_teachers);
router.post('/teacher', create_teacher);
router.put('/teacher/:id', update_teacher);
router.delete('/teacher/:id', delete_teacher);

// ==============================
// Assessments routes
// ==============================
router.post('/assessments', create_assessment);
router.get('/assessments', get_all_assessments);
router.get('/assessments/:id', get_assessment_by_id);
router.put('/assessments/:id', update_assessment);
router.delete('/assessments/:id', delete_assessment);

// ==============================
// Absences routes
// ==============================
router.post('/absences', create_absence);
router.get('/absences', get_all_absences);
router.get('/absences/:id', get_absence_by_id);
router.put('/absences/:id', update_absence);
router.delete('/absences/:id', delete_absence);

// ==============================
// Time Registration routes
// ==============================
router.post('/time-registrations', create_time_registration);
router.put('/time-registrations/:id', update_time_registration);
router.put('/time-registrations/:id/approve', approve_time_registration);
router.get('/time-registrations/teacher/:teacher_id', get_teacher_time_registrations);
router.get('/time-registrations', get_all_time_registrations);

// ==============================
// Classrooms routes
// ==============================
router.post('/classrooms', create_classroom);
router.get('/classrooms', get_classrooms);
router.get('/classrooms/:id', get_classroom);
router.put('/classrooms/:id', update_classroom);
router.delete('/classrooms/:id', delete_classroom);

// ==============================
// Results routes
// ==============================
router.post('/results', create_result);
router.get('/results', get_all_results);
router.get('/results/:id', get_result_by_id);
router.put('/results/:id', update_result);
router.delete('/results/:id', delete_result);

module.exports = router;