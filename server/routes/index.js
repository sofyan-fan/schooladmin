const express = require('express');
const router = express.Router();

const auth_routes = require('./auth_routes');
const dashboard_routes = require('./dashboard_routes');
const general_routes = require('./general_routes');

// middleware
const auth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(403).json({
            message: "Not authorized."
        });
    }
    next();
};

// core features
router.use('/auth', auth_routes);
router.use('/dashboard', auth, dashboard_routes);
router.use('/general', auth, general_routes);

module.exports = router;