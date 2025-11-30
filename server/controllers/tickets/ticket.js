const { prisma } = require('../../prisma/connection');
const {
  sendCommentNotification,
  sendAssigneeChangeNotification,
  sendStatusChangeNotification,
} = require('../../services/emailService');

// Create a new ticket
exports.create_ticket = async (req, res) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { title, description, priority = 'medium' } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    // Only students and teachers can create tickets
    const role = (sessionUser.role || '').toLowerCase();
    if (!['student', 'teacher'].includes(role)) {
      return res.status(403).json({ message: 'Only students and teachers can create tickets' });
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ message: 'Invalid priority. Must be: low, medium, high, or urgent' });
    }

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        priority,
        created_by_user_id: sessionUser.id,
        status: 'open',
      },
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

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ message: 'Failed to create ticket', error: error.message });
  }
};

// Get all tickets (with filtering based on role)
exports.get_all_tickets = async (req, res) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const role = (sessionUser.role || '').toLowerCase();
    const { status, priority, assigned_to } = req.query;

    let where = {};

    // Students and teachers can only see their own tickets
    if (role === 'student' || role === 'teacher') {
      where.created_by_user_id = sessionUser.id;
    }
    // Admins can see all tickets

    // Apply filters
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (assigned_to) {
      where.assigned_to_user_id = parseInt(assigned_to);
    }

    const tickets = await prisma.ticket.findMany({
      where,
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
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    res.status(200).json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Failed to fetch tickets', error: error.message });
  }
};

// Get ticket by ID
exports.get_ticket_by_id = async (req, res) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params;
    const role = (sessionUser.role || '').toLowerCase();

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
        comments: {
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
        },
        history: {
          include: {
            changed_by_user: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check permissions: students/teachers can only see their own tickets
    if ((role === 'student' || role === 'teacher') && ticket.created_by_user_id !== sessionUser.id) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own tickets' });
    }

    res.status(200).json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ message: 'Failed to fetch ticket', error: error.message });
  }
};

// Update ticket (only admins can update)
exports.update_ticket = async (req, res) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const role = (sessionUser.role || '').toLowerCase();
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update tickets' });
    }

    const { id } = req.params;
    const { title, description, status, priority, assigned_to_user_id } = req.body;

    // Get current ticket to track changes
    const currentTicket = await prisma.ticket.findUnique({
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

    if (!currentTicket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const updateData = {};
    const historyEntries = [];

    // Track changes
    if (title !== undefined && title !== currentTicket.title) {
      updateData.title = title;
    }
    if (description !== undefined && description !== currentTicket.description) {
      updateData.description = description;
    }

    // Track status change
    if (status !== undefined && status !== currentTicket.status) {
      const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      updateData.status = status;
      historyEntries.push({
        ticket_id: parseInt(id),
        field_changed: 'status',
        old_value: currentTicket.status,
        new_value: status,
        changed_by_user_id: sessionUser.id,
      });
    }

    // Track priority change
    if (priority !== undefined && priority !== currentTicket.priority) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ message: 'Invalid priority' });
      }
      updateData.priority = priority;
      historyEntries.push({
        ticket_id: parseInt(id),
        field_changed: 'priority',
        old_value: currentTicket.priority,
        new_value: priority,
        changed_by_user_id: sessionUser.id,
      });
    }

    // Track assignee change
    if (assigned_to_user_id !== undefined) {
      const newAssigneeId = assigned_to_user_id ? parseInt(assigned_to_user_id) : null;
      if (newAssigneeId !== currentTicket.assigned_to_user_id) {
        updateData.assigned_to_user_id = newAssigneeId;
        historyEntries.push({
          ticket_id: parseInt(id),
          field_changed: 'assignee',
          old_value: currentTicket.assigned_to_user_id?.toString() || 'null',
          new_value: newAssigneeId?.toString() || 'null',
          changed_by_user_id: sessionUser.id,
        });
      }
    }

    // Update ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: updateData,
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

    // Create history entries
    if (historyEntries.length > 0) {
      await prisma.ticket_history.createMany({
        data: historyEntries,
      });
    }

    // Send email notifications
    const changedBy = {
      id: sessionUser.id,
      email: sessionUser.email,
      role: sessionUser.role,
    };

    // Send status change notification
    if (status !== undefined && status !== currentTicket.status) {
      await sendStatusChangeNotification(
        updatedTicket,
        currentTicket.status,
        status,
        changedBy
      ).catch(err => console.error('Error sending status change notification:', err));
    }

    // Send assignee change notification
    if (assigned_to_user_id !== undefined) {
      const oldAssigneeId = currentTicket.assigned_to_user_id;
      const newAssigneeId = assigned_to_user_id ? parseInt(assigned_to_user_id) : null;

      if (oldAssigneeId !== newAssigneeId) {
        // Fetch old and new assignees
        const [oldAssignee, newAssignee] = await Promise.all([
          oldAssigneeId
            ? prisma.user.findUnique({
                where: { id: oldAssigneeId },
                select: { id: true, email: true, role: true },
              })
            : null,
          newAssigneeId
            ? prisma.user.findUnique({
                where: { id: newAssigneeId },
                select: { id: true, email: true, role: true },
              })
            : null,
        ]);

        await sendAssigneeChangeNotification(
          updatedTicket,
          oldAssignee,
          newAssignee,
          changedBy
        ).catch(err => console.error('Error sending assignee change notification:', err));
      }
    }

    res.status(200).json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ message: 'Failed to update ticket', error: error.message });
  }
};

// Delete ticket (only admins)
exports.delete_ticket = async (req, res) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const role = (sessionUser.role || '').toLowerCase();
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete tickets' });
    }

    const { id } = req.params;

    await prisma.ticket.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ message: 'Failed to delete ticket', error: error.message });
  }
};

// Get users for ticket assignment (admins only)
exports.get_users_for_assignment = async (req, res) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const role = (sessionUser.role || '').toLowerCase();
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view users for assignment' });
    }

    // Get all active users (admins can be assigned tickets)
    const users = await prisma.user.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
      orderBy: {
        email: 'asc',
      },
    });

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users for assignment:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

