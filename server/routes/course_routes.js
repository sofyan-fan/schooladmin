const express = require('express');
const router = express.Router();

const {
  get_all_courses,
  create_course,
  update_course,
  delete_course, 
  get_all_modules,
  create_module,
  update_module, 
  delete_module, 
} = require('../controllers/general/course');

// Course routes
router.get('/courses', get_all_courses);
router.post('/courses', create_course);
router.put('/courses/:id', update_course);
router.delete('/courses/:id', delete_course);

// Course Module routes
router.get('/modules', get_all_modules);
router.post('/modules', create_module);
router.put('/modules/:id', update_module);
router.delete('/modules/:id', delete_module);

module.exports = router;
