const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function parseIdParam(id) {
  const raw = String(id ?? '');
  if (!/^\d+$/.test(raw)) {
    const err = new Error('Invalid id parameter (expected a numeric id).');
    err.statusCode = 400;
    throw err;
  }
  return Number(raw);
}

// Valid log types
const VALID_LOG_TYPES = ['les', 'quran'];

// Create a lesson log
exports.create_lesson_log = async (req, res) => {
  try {
    const { roster_id, teacher_id, teacher_name, date, type, content } = req.body;

    // Validate required fields
    if (!roster_id) {
      return res.status(400).json({ error: 'roster_id is required.' });
    }
    if (!teacher_id) {
      return res.status(400).json({ error: 'teacher_id is required.' });
    }
    if (!date) {
      return res.status(400).json({ error: 'date is required.' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'content is required.' });
    }

    // Validate log type
    const logType = type || 'les';
    if (!VALID_LOG_TYPES.includes(logType)) {
      return res
        .status(400)
        .json({ error: `type must be one of: ${VALID_LOG_TYPES.join(', ')}` });
    }

    // Check if roster exists
    const roster = await prisma.roster.findUnique({
      where: { id: Number(roster_id) },
    });
    if (!roster) {
      return res.status(404).json({ error: 'Roster not found.' });
    }

    // Parse date to start of day to ensure consistent key
    const parsedDate = new Date(date);
    parsedDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

    // Create or update (upsert) the lesson log
    const lesson_log = await prisma.lesson_log.upsert({
      where: {
        roster_id_date: {
          roster_id: Number(roster_id),
          date: parsedDate,
        },
      },
      update: {
        content: content.trim(),
        type: logType,
        teacher_id: Number(teacher_id),
        teacher_name: teacher_name || '',
      },
      create: {
        roster_id: Number(roster_id),
        teacher_id: Number(teacher_id),
        teacher_name: teacher_name || '',
        date: parsedDate,
        type: logType,
        content: content.trim(),
      },
      include: {
        roster: {
          include: {
            subject: true,
            class_layout: true,
            teacher: true,
            classroom: true,
          },
        },
      },
    });

    res.status(201).json(lesson_log);
  } catch (error) {
    if (error?.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error creating lesson log:', error);
    res.status(500).json({ error: 'Failed to create lesson log.' });
  }
};

// Get all lesson logs (with optional filters)
exports.get_all_lesson_logs = async (req, res) => {
  try {
    const { roster_id, teacher_id, type, from_date, to_date } = req.query;

    const where = {};

    if (roster_id) {
      where.roster_id = Number(roster_id);
    }
    if (teacher_id) {
      where.teacher_id = Number(teacher_id);
    }
    if (type && VALID_LOG_TYPES.includes(type)) {
      where.type = type;
    }
    if (from_date || to_date) {
      where.date = {};
      if (from_date) {
        where.date.gte = new Date(from_date);
      }
      if (to_date) {
        where.date.lte = new Date(to_date);
      }
    }

    const logs = await prisma.lesson_log.findMany({
      where,
      include: {
        roster: {
          include: {
            subject: true,
            class_layout: true,
            teacher: true,
            classroom: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching lesson logs:', error);
    res.status(500).json({ error: 'Failed to fetch lesson logs.' });
  }
};

// Get a single lesson log by ID
exports.get_lesson_log_by_id = async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = parseIdParam(id);

    const log = await prisma.lesson_log.findUnique({
      where: { id: numericId },
      include: {
        roster: {
          include: {
            subject: true,
            class_layout: true,
            teacher: true,
            classroom: true,
          },
        },
      },
    });

    if (!log) {
      return res.status(404).json({ error: 'Lesson log not found.' });
    }

    res.status(200).json(log);
  } catch (error) {
    if (error?.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error fetching lesson log:', error);
    res.status(500).json({ error: 'Failed to fetch lesson log.' });
  }
};

// Get lesson log by roster_id and date
exports.get_lesson_log_by_roster_date = async (req, res) => {
  try {
    const { roster_id, date } = req.query;

    if (!roster_id || !date) {
      return res
        .status(400)
        .json({ error: 'roster_id and date are required.' });
    }

    const parsedDate = new Date(date);
    parsedDate.setHours(12, 0, 0, 0);

    const log = await prisma.lesson_log.findUnique({
      where: {
        roster_id_date: {
          roster_id: Number(roster_id),
          date: parsedDate,
        },
      },
      include: {
        roster: {
          include: {
            subject: true,
            class_layout: true,
            teacher: true,
            classroom: true,
          },
        },
      },
    });

    // Return null when no log exists yet (this is a normal case, not an error)
    res.status(200).json(log);
  } catch (error) {
    console.error('Error fetching lesson log by roster/date:', error);
    res.status(500).json({ error: 'Failed to fetch lesson log.' });
  }
};

// Get all logs for a specific roster
exports.get_logs_for_roster = async (req, res) => {
  try {
    const { roster_id } = req.params;
    const numericId = parseIdParam(roster_id);

    const logs = await prisma.lesson_log.findMany({
      where: { roster_id: numericId },
      include: {
        roster: {
          include: {
            subject: true,
            class_layout: true,
            teacher: true,
            classroom: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    res.status(200).json(logs);
  } catch (error) {
    if (error?.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error fetching logs for roster:', error);
    res.status(500).json({ error: 'Failed to fetch logs for roster.' });
  }
};

// Update a lesson log
exports.update_lesson_log = async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = parseIdParam(id);
    const { content, type, teacher_id, teacher_name } = req.body;

    const data = {};

    if (content !== undefined) {
      if (!content.trim()) {
        return res.status(400).json({ error: 'content cannot be empty.' });
      }
      data.content = content.trim();
    }

    if (type !== undefined) {
      if (!VALID_LOG_TYPES.includes(type)) {
        return res
          .status(400)
          .json({ error: `type must be one of: ${VALID_LOG_TYPES.join(', ')}` });
      }
      data.type = type;
    }

    if (teacher_id !== undefined) {
      data.teacher_id = Number(teacher_id);
    }

    if (teacher_name !== undefined) {
      data.teacher_name = teacher_name;
    }

    const updated_log = await prisma.lesson_log.update({
      where: { id: numericId },
      data,
      include: {
        roster: {
          include: {
            subject: true,
            class_layout: true,
            teacher: true,
            classroom: true,
          },
        },
      },
    });

    res.status(200).json(updated_log);
  } catch (error) {
    if (error?.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Lesson log not found.' });
    }
    console.error('Error updating lesson log:', error);
    res.status(500).json({ error: 'Failed to update lesson log.' });
  }
};

// Delete a lesson log
exports.delete_lesson_log = async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = parseIdParam(id);

    await prisma.lesson_log.delete({
      where: { id: numericId },
    });

    res.status(204).send();
  } catch (error) {
    if (error?.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Lesson log not found.' });
    }
    console.error('Error deleting lesson log:', error);
    res.status(500).json({ error: 'Failed to delete lesson log.' });
  }
};
