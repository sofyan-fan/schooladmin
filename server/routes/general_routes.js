const express = require('express');
const router = express.Router();

const {
  get_all_students,
  get_student_by_id,
  search_students,
} = require('../controllers/general/user_document');

router.get('/', get_all_students);
router.get('/search', search_students);
router.get('/:id', get_student_by_id);

module.exports = router;