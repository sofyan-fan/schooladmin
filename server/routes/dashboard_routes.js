const express = require('express');
const router = express.Router();

const { create_roster, get_roster, update_roster } = require('../controllers/roster');

const { get_events, create_event, delete_event, edit_event } = require('../controllers/event');

router.get('/event', get_events);
router.post('/event', create_event);
router.put('/event/:id', edit_event);
router.delete('/event/:id', delete_event);

router.post('/roster', create_roster);
router.get('/roster', get_roster);
router.put('/roster/:id', update_roster);

module.exports = router;