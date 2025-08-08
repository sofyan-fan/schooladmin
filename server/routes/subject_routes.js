const express = require('express');
const router = express.Router();

const {
  get_all_subjects,
  get_subject_by_id,
  create_subject,
  update_subject,
  delete_subject
} = require('../controllers/general/subject');

// Subject routes
router.get('/subjects', get_all_subjects);
router.get('/subjects/:id', get_subject_by_id);
router.post('/subjects', create_subject);
router.put('/subjects/:id', update_subject);
router.delete('/subjects/:id', delete_subject);

module.exports = router;
