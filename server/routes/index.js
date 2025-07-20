const express = require('express');
const router = express.Router();

const auth_routes = require('./auth_routes');
const dashboard_routes = require('./dashboard_routes');
const general_routes = require('./general_routes');

// core features
router.use('/auth', auth_routes);
router.use('/dashboard', dashboard_routes);
router.use('/general', general_routes);

module.exports = router;