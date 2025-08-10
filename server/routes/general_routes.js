const express = require('express');
const router = express.Router();

const {
  get_all_students,
  get_student_by_id,
  search_students,
  get_all_teachers,
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
} = require('../controllers/general/absence');

// Students routes
router.get('/students', get_all_students);
router.get('/teacher', get_all_students);
router.get('/student/:id', get_student_by_id);
router.get('/search/student', search_students);

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