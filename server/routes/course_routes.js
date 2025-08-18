const express = require('express');
const router = express.Router();

const {
  get_all_courses,
  create_course,
  get_all_modules,
  create_module,
} = require('../controllers/general/course');

// Course routes
router.get('/courses', get_all_courses);
router.post('/courses', create_course);

// Course Module routes
router.get('/modules', get_all_modules);
router.post('/modules', create_module);

module.exports = router;