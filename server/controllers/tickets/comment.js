const { prisma } = require('../../prisma/connection');
const { sendCommentNotification } = require('../../services/emailService');

// Add a comment to a ticket
exports.add_comment = async (req, res) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params; // ticket id
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    // Check if ticket exists and user has permission
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
      include: {
        created_by_user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        assigned_to_user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const role = (sessionUser.role || '').toLowerCase();
    // Students and teachers can only comment on their own tickets
    if ((role === 'student' || role === 'teacher') && ticket.created_by_user_id !== sessionUser.id) {
      return res.status(403).json({ message: 'Forbidden: You can only comment on your own tickets' });
    }

    // Create comment
    const comment = await prisma.ticket_comment.create({
      data: {
        ticket_id: parseInt(id),
        user_id: sessionUser.id,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Send email notifications to relevant users
    const commenter = {
      id: sessionUser.id,
      email: sessionUser.email,
      role: sessionUser.role,
    };

    // Collect recipients: ticket creator, assignee (if any), and all commenters (except the current commenter)
    const recipients = new Map();

    // Add ticket creator
    if (ticket.created_by_user && ticket.created_by_user.email) {
      recipients.set(ticket.created_by_user.email, ticket.created_by_user);
    }

    // Add assignee
    if (ticket.assigned_to_user && ticket.assigned_to_user.email) {
      recipients.set(ticket.assigned_to_user.email, ticket.assigned_to_user);
    }

    // Get all previous commenters
    const previousComments = await prisma.ticket_comment.findMany({
      where: {
        ticket_id: parseInt(id),
        user_id: { not: sessionUser.id }, // Exclude current commenter
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    previousComments.forEach(c => {
      if (c.user && c.user.email) {
        recipients.set(c.user.email, c.user);
      }
    });

    // Send notification (don't notify the commenter themselves)
    recipients.delete(sessionUser.email);
    const recipientArray = Array.from(recipients.values());

    if (recipientArray.length > 0) {
      await sendCommentNotification(ticket, comment, commenter, recipientArray).catch(err =>
        console.error('Error sending comment notification:', err)
      );
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
};

// Get all comments for a ticket
exports.get_comments = async (req, res) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params; // ticket id

    // Check if ticket exists and user has permission
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const role = (sessionUser.role || '').toLowerCase();
    // Students and teachers can only see comments on their own tickets
    if ((role === 'student' || role === 'teacher') && ticket.created_by_user_id !== sessionUser.id) {
      return res.status(403).json({ message: 'Forbidden: You can only view comments on your own tickets' });
    }

    const comments = await prisma.ticket_comment.findMany({
      where: { ticket_id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Failed to fetch comments', error: error.message });
  }
};

// Update a comment (only the commenter or admin)
exports.update_comment = async (req, res) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id, commentId } = req.params; // ticket id and comment id
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    // Check if comment exists
    const comment = await prisma.ticket_comment.findUnique({
      where: { id: parseInt(commentId) },
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.ticket_id !== parseInt(id)) {
      return res.status(400).json({ message: 'Comment does not belong to this ticket' });
    }

    const role = (sessionUser.role || '').toLowerCase();
    // Only the commenter or admin can update
    if (comment.user_id !== sessionUser.id && role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You can only update your own comments' });
    }

    const updatedComment = await prisma.ticket_comment.update({
      where: { id: parseInt(commentId) },
      data: {
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    res.status(200).json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Failed to update comment', error: error.message });
  }
};

// Delete a comment (only the commenter or admin)
exports.delete_comment = async (req, res) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id, commentId } = req.params; // ticket id and comment id

    // Check if comment exists
    const comment = await prisma.ticket_comment.findUnique({
      where: { id: parseInt(commentId) },
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.ticket_id !== parseInt(id)) {
      return res.status(400).json({ message: 'Comment does not belong to this ticket' });
    }

    const role = (sessionUser.role || '').toLowerCase();
    // Only the commenter or admin can delete
    if (comment.user_id !== sessionUser.id && role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own comments' });
    }

    await prisma.ticket_comment.delete({
      where: { id: parseInt(commentId) },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Failed to delete comment', error: error.message });
  }
};

