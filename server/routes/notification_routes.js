const express = require('express');
const router = express.Router();

const {
  get_notifications,
  create_notification,
  update_notification,
  delete_notification,
} = require('../controllers/notification');

// GET /api/notifications
router.get('/', get_notifications);

// POST /api/notifications
router.post('/', create_notification);

// PUT /api/notifications/:id
router.put('/:id', update_notification);

// DELETE /api/notifications/:id
router.delete('/:id', delete_notification);

module.exports = router;


