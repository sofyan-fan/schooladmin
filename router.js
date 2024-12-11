const express = require('express');
const router = express.Router();

const { get_login, login } = require('./controllers/auth/login');
const { get_dashboard } = require('./controllers/dashboard');


//login
router.get('/', get_login);
router.get('/login', get_login);
router.post('/login', login);

//dashboard
router.get('/dashboard', get_dashboard);


module.exports = router;