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
  create_test,
  get_all_tests,
  get_test_by_id,
  update_test,
  delete_test,
  create_exam,
  get_all_exams,
  get_exam_by_id,
  update_exam,
  delete_exam,
} = require('../controllers/general/test_exam');

const {
  create_assessment,
  get_all_assessments,
  get_assessment_by_id,
  update_assessment,
  delete_assessment,
} = require('../controllers/general/assesment');

const {
  create_result,
  get_all_results,
  get_result_by_id,
  update_result,
  delete_result,
} = require('../controllers/general/result');

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
  get_all_time_registrations,
} = require('../controllers/general/time_registration');

const {
  create_classroom,
  get_classrooms,
  get_classroom,
  update_classroom,
  delete_classroom,
} = require('../controllers/general/classroom');

const {
  create_class_layout,
  get_class_layouts,
  get_class_layout,
  update_class_layout,
  delete_class_layout,
  add_students_to_class,
  assign_mentor,
} = require('../controllers/general/class_layout');

const {
  create_financial_type,
  get_financial_types,
  update_financial_type,
  delete_financial_type,
  create_financial_log,
  get_financial_logs,
  update_financial_log,
  delete_financial_log,
} = require('../controllers/general/finance');

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
// Tests routes
// ==============================
router.post('/tests', create_test);
router.get('/tests', get_all_tests);
router.get('/tests/:id', get_test_by_id);
router.put('/tests/:id', update_test);
router.delete('/tests/:id', delete_test);

// ==============================
// Exams routes
// ==============================
router.post('/exams', create_exam);
router.get('/exams', get_all_exams);
router.get('/exams/:id', get_exam_by_id);
router.put('/exams/:id', update_exam);
router.delete('/exams/:id', delete_exam);

// ==============================
// Assessments routes
// ==============================
router.post('/assessments', create_assessment);
router.get('/assessments', get_all_assessments);
router.get('/assessments/:id', get_assessment_by_id);
router.put('/assessments/:id', update_assessment);
router.delete('/assessments/:id', delete_assessment);

// ==============================
// Results routes
// ==============================
router.post('/results', create_result);
router.get('/results', get_all_results);
router.get('/results/:id', get_result_by_id);
router.put('/results/:id', update_result);
router.delete('/results/:id', delete_result);

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
router.get(
  '/time-registrations/teacher/:teacher_id',
  get_teacher_time_registrations
);
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
// Class Layouts routes
// ==============================
router.post('/class_layouts', create_class_layout);
router.get('/class_layouts', get_class_layouts);
router.get('/class_layouts/:id', get_class_layout);
router.put('/class_layouts/:id', update_class_layout);
router.delete('/class_layouts/:id', delete_class_layout);
router.post('/class_layouts/:class_id/students', add_students_to_class);
router.put('/class_layouts/:class_id/mentor', assign_mentor);

// ==============================
// Financial Types routes
// ==============================
router.post('/financial_types', create_financial_type);
router.get('/financial_types', get_financial_types);
router.put('/financial_types/:id', update_financial_type);
router.delete('/financial_types/:id', delete_financial_type);

// ==============================
// Financial Logs routes
// ==============================
router.post('/financial_logs', create_financial_log);
router.get('/financial_logs', get_financial_logs);
router.put('/financial_logs/:id', update_financial_log);
router.delete('/financial_logs/:id', delete_financial_log);

module.exports = router;
