const express = require('express');
const router = express.Router();

const auth_routes = require('./auth_routes');
const dashboard_routes = require('./dashboard_routes');
const general_routes = require('./general_routes');
const course_routes = require('./course_routes');
const subject_routes = require('./subject_routes');

// core features
router.use('/auth', auth_routes);
router.use('/dashboard', dashboard_routes);
router.use('/general', general_routes);

// course and subject routes
router.use('/courses', course_routes);
router.use('/subjects', subject_routes);

module.exports = router;
