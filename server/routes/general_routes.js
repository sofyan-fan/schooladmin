const express = require('express');
const router = express.Router();

const {
  get_all_students,
  get_student_by_id,
  search_students,
} = require('../controllers/general/user_document');

const assessmentController = require('../controllers/assessmentController');


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

// Create an assessment
router.post('/assessments', assessmentController.create_assessment);
router.get('/assessments', assessmentController.get_all_assessments);
router.get('/assessments/:id', assessmentController.get_assessment_by_id);
router.put('/assessments/:id', assessmentController.update_assessment);
router.delete('/assessments/:id', assessmentController.delete_assessment);

module.exports = router;