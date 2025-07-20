const express = require('express');
const router = express.Router();

const { create_roster, get_roster, update_roster } = require('../controllers/roster');

const { get_events, create_event, delete_event, edit_event } = require('../controllers/event');

router.get('/', get_events);
router.post('/', create_event);
router.put('/:id', edit_event);
router.delete('/:id', delete_event);

router.post('/', create_roster);
router.get('/', get_roster);
router.put('/:id', update_roster);

module.exports = router;