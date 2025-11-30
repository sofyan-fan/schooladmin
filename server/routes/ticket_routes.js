const express = require('express');
const router = express.Router();

const {
  create_ticket,
  get_all_tickets,
  get_ticket_by_id,
  update_ticket,
  delete_ticket,
  get_users_for_assignment,
} = require('../controllers/tickets/ticket');

const {
  add_comment,
  get_comments,
  update_comment,
  delete_comment,
} = require('../controllers/tickets/comment');

// Ticket routes
router.post('/tickets', create_ticket);
router.get('/tickets', get_all_tickets);
router.get('/tickets/users', get_users_for_assignment); // Get users for assignment (admin only)
router.get('/tickets/:id', get_ticket_by_id);
router.put('/tickets/:id', update_ticket);
router.delete('/tickets/:id', delete_ticket);

// Comment routes
router.post('/tickets/:id/comments', add_comment);
router.get('/tickets/:id/comments', get_comments);
router.put('/tickets/:id/comments/:commentId', update_comment);
router.delete('/tickets/:id/comments/:commentId', delete_comment);

module.exports = router;

