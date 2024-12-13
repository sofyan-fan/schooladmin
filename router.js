const express = require('express');
const router = express.Router();

const { get_login, login } = require('./controllers/auth/login');
const { get_dashboard } = require('./controllers/dashboard');
const { create_event, delete_event, edit_event } = require('./controllers/event');


//login
router.get('/', get_login);
router.get('/login', get_login);
router.post('/login', login);

//dashboard
router.get('/dashboard', get_dashboard);

//event
router.post('/event', create_event);
router.post('/event/delete/:id', delete_event);
router.post('/event/edit/:id', edit_event);


module.exports = router;