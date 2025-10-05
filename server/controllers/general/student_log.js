const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create
exports.create_student_log = async (req, res) => {
  try {
    const { student_id, date, start_log, end_log, completed, comment } = req.body;

    const new_log = await prisma.student_log.create({
      data: {
        student_id,
        date: new Date(date),
        start_log,
        end_log,
        completed,
        comment,
      },
      include: {
        student: true,
      },
    });

    res.status(201).json(new_log);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create student log.' });
  }
};

// Read all
exports.get_all_student_logs = async (req, res) => {
  try {
    const logs = await prisma.student_log.findMany({
      include: {
        student: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    res.status(200).json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch student logs.' });
  }
};

// Read by ID
exports.get_student_log_by_id = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await prisma.student_log.findUnique({
      where: { id: Number(id) },
      include: { student: true },
    });

    if (!log) {
      return res.status(404).json({ error: 'Student log not found.' });
    }

    res.status(200).json(log);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch student log.' });
  }
};


// Update
exports.update_student_log = async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id, date, start_log, end_log, completed, comment } = req.body;

    const updated_log = await prisma.student_log.update({
      where: { id: Number(id) },
      data: {
        student_id,
        date: new Date(date),
        start_log,
        end_log,
        completed,
        comment,
      },
    });

    res.status(200).json(updated_log);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update student log.' });
  }
};

// Delete
exports.delete_student_log = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.student_log.delete({
      where: { id: Number(id) },
    });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete student log.' });
  }
};
