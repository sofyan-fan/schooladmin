const express = require('express');
const router = express.Router();

const { requireAdmin } = require('../middleware/auth');
const {
  create_school_year,
  get_all_school_years,
  get_school_year,
  set_active_school_year,
  archive_current_data,
} = require('../controllers/general/school_year');

// All routes require admin access
router.use(requireAdmin);

// Create a new school year (archives current data)
router.post('/', create_school_year);

// Get all school years
router.get('/', get_all_school_years);

// Get a specific school year by ID
router.get('/:id', get_school_year);

// Set active school year
router.put('/:id/activate', set_active_school_year);

// Archive current data manually (optional endpoint)
router.post('/archive', archive_current_data);

module.exports = router;

