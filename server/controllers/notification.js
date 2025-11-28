const { prisma } = require('../prisma/connection');

// Get notifications visible for the current user
// - Admin: all notifications
// - Other roles (student/teacher): only their own notifications
exports.get_notifications = async (req, res) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const role = String(sessionUser.role || '').toLowerCase();
    const where =
      role === 'admin'
        ? {}
        : {
            // Filter by related user (current logged-in user)
            user: {
              is: {
                id: Number(sessionUser.id),
              },
            },
          };

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while fetching notifications' });
  }
};

// Create a new notification
exports.create_notification = async (req, res) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const subjectRaw =
      typeof req.body.subject === 'string' ? req.body.subject : '';
    const messageRaw =
      typeof req.body.message === 'string' ? req.body.message : '';

    const subject = subjectRaw.trim() || 'Melding';
    const message = messageRaw.trim();

    if (!message) {
      return res
        .status(400)
        .json({ error: 'Bericht (message) mag niet leeg zijn.' });
    }

    const notification = await prisma.notification.create({
      data: {
        subject,
        message,
        // Link to the current user via relation
        user: {
          connect: { id: Number(sessionUser.id) },
        },
      },
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while creating the notification' });
  }
};

// Delete a notification by id
exports.delete_notification = async (req, res) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid notification id' });
    }

    const role = String(sessionUser.role || '').toLowerCase();

    // Admins can delete any notification; others can delete only their own
    if (role === 'admin') {
      await prisma.notification.delete({ where: { id } });
    } else {
      const existing = await prisma.notification.findUnique({ where: { id } });
      if (!existing || existing.user_id !== Number(sessionUser.id)) {
        return res.status(403).json({
          error: 'You are not allowed to delete this notification',
        });
      }
      await prisma.notification.delete({ where: { id } });
    }

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while deleting the notification' });
  }
};


