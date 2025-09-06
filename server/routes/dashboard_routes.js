const express = require('express');
const router = express.Router();

const {
  create_roster,
  get_roster,
  update_roster,
  delete_roster,
} = require('../controllers/dashboard/roster');

const {
  get_events,
  create_event,
  delete_event,
  edit_event,
} = require('../controllers/dashboard/event');

router.get('/event', get_events);
router.post('/event', create_event);
router.put('/event/:id', edit_event);
router.delete('/event/:id', delete_event);

router.post('/roster', create_roster);
router.get('/roster', get_roster);
router.put('/roster/:id', update_roster);
router.delete('/roster/:id', delete_roster);

// Support plural endpoints for client compatibility
router.post('/rosters', create_roster);
router.get('/rosters', get_roster);
router.put('/rosters/:id', update_roster);
router.delete('/rosters/:id', delete_roster);

module.exports = router;
