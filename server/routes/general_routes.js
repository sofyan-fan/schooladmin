const express = require('express');
const router = express.Router();

const {
  get_all_students,
  get_student_by_id,
  search_students,
} = require('../controllers/general/user_document');

router.get('/get_students', get_all_students);
router.get('/get_student/:id', get_student_by_id);
router.get('/search_student', search_students);

module.exports = router;