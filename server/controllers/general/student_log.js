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

function parseScoreOrNull(value, fieldName) {
  // undefined: not provided (no change for PATCH-like updates)
  if (value === undefined) return undefined;
  // null/empty-string: explicitly cleared
  if (value === null || value === '') return null;

  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 10) {
    const err = new Error(
      `${fieldName} must be an integer between 0 and 10 (inclusive).`
    );
    err.statusCode = 400;
    throw err;
  }
  return n;
}

// Create
exports.create_student_log = async (req, res) => {
  try {
    const {
      student_id,
      date,
      start_log,
      end_log,
      completed,
      comment,
      nourania_score,
      tilawa_score,
      tajweed_score,
      hifdh_score,
    } = req.body;

    const parsedNourania = parseScoreOrNull(nourania_score, 'nourania_score');
    const parsedTilawa = parseScoreOrNull(tilawa_score, 'tilawa_score');
    const parsedTajweed = parseScoreOrNull(tajweed_score, 'tajweed_score');
    const parsedHifdh = parseScoreOrNull(hifdh_score, 'hifdh_score');

    const new_log = await prisma.student_log.create({
      data: {
        student_id,
        date: new Date(date),
        start_log,
        end_log,
        completed,
        comment,
        nourania_score: parsedNourania,
        tilawa_score: parsedTilawa,
        tajweed_score: parsedTajweed,
        hifdh_score: parsedHifdh,
      },
      include: {
        student: true,
      },
    });

    res.status(201).json(new_log);
  } catch (error) {
    if (error?.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
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
    const numericId = parseIdParam(id);

    const log = await prisma.student_log.findUnique({
      where: { id: numericId },
      include: { student: true },
    });

    if (!log) {
      return res.status(404).json({ error: 'Student log not found.' });
    }

    res.status(200).json(log);
  } catch (error) {
    if (error?.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch student log.' });
  }
};


// Update (supports partial updates)
exports.update_student_log = async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = parseIdParam(id);
    const {
      student_id,
      date,
      start_log,
      end_log,
      completed,
      comment,
      nourania_score,
      tilawa_score,
      tajweed_score,
      hifdh_score,
    } = req.body;

    const data = {};
    if (student_id !== undefined) data.student_id = student_id;
    if (date !== undefined) data.date = new Date(date);
    if (start_log !== undefined) data.start_log = start_log;
    if (end_log !== undefined) data.end_log = end_log;
    if (completed !== undefined) data.completed = completed;
    if (comment !== undefined) data.comment = comment;
    if (nourania_score !== undefined)
      data.nourania_score = parseScoreOrNull(nourania_score, 'nourania_score');
    if (tilawa_score !== undefined)
      data.tilawa_score = parseScoreOrNull(tilawa_score, 'tilawa_score');
    if (tajweed_score !== undefined)
      data.tajweed_score = parseScoreOrNull(tajweed_score, 'tajweed_score');
    if (hifdh_score !== undefined)
      data.hifdh_score = parseScoreOrNull(hifdh_score, 'hifdh_score');

    const updated_log = await prisma.student_log.update({
      where: { id: numericId },
      data,
    });

    res.status(200).json(updated_log);
  } catch (error) {
    if (error?.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Student log not found.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to update student log.' });
  }
};

// Delete
exports.delete_student_log = async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = parseIdParam(id);

    await prisma.student_log.delete({
      where: { id: numericId },
    });

    res.status(204).send();
  } catch (error) {
    if (error?.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Student log not found.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to delete student log.' });
  }
};
