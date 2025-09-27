const { prisma } = require('../../prisma/connection');

/* -------------------- FINANCIAL TYPES CRUD -------------------- */

// Create financial type
exports.create_financial_type = async (req, res) => {
  try {
    const { name, description } = req.body;

    const type = await prisma.financial_type.create({
      data: { name, description },
    });

    res.status(201).json({ message: 'Financial type created', type });
  } catch (error) {
    console.error('Error creating financial type:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get all financial types
exports.get_financial_types = async (req, res) => {
  try {
    const types = await prisma.financial_type.findMany();
    res.status(200).json(types);
  } catch (error) {
    console.error('Error fetching financial types:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Update financial type
exports.update_financial_type = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const updated = await prisma.financial_type.update({
      where: { id: parseInt(id) },
      data: { name, description },
    });

    res.status(200).json({ message: 'Financial type updated', updated });
  } catch (error) {
    console.error('Error updating financial type:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Delete financial type
exports.delete_financial_type = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.financial_type.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ message: 'Financial type deleted' });
  } catch (error) {
    console.error('Error deleting financial type:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/* -------------------- FINANCIAL LOG CRUD -------------------- */

// Log financial transaction
exports.create_financial_log = async (req, res) => {
  try {
    const {
      type_id,
      student_id,
      course_id,
      amount,
      method,
      notes,
      transaction_type,
    } = req.body;

    if (!['income', 'expense'].includes(transaction_type)) {
      return res
        .status(400)
        .json({ error: "transaction_type must be 'income' or 'expense'" });
    }

    const log = await prisma.financial_log.create({
      data: {
        type_id: parseInt(type_id),
        student_id: student_id ? parseInt(student_id) : null,
        course_id: course_id ? parseInt(course_id) : null,
        amount: parseFloat(amount),
        method,
        notes,
        transaction_type,
      },
      include: {
        type: true,
        student: { select: { first_name: true, last_name: true } },
        course: { select: { name: true } },
      },
    });

    res.status(201).json({ message: 'Financial log created', log });
  } catch (error) {
    console.error('Error creating financial log:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get all financial logs
exports.get_financial_logs = async (req, res) => {
  try {
    const logs = await prisma.financial_log.findMany({
      include: {
        type: true,
        student: { select: { first_name: true, last_name: true } },
        course: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });

    const formatted = logs.map((log) => ({
      id: log.id,
      type: log.type.name,
      student: log.student
        ? `${log.student.first_name} ${log.student.last_name}`
        : null,
      course: log.course ? log.course.name : null,
      amount: log.amount,
      method: log.method,
      notes: log.notes,
      date: log.date,
      transaction_type: log.transaction_type,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching financial logs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Update financial log
exports.update_financial_log = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type_id,
      student_id,
      course_id,
      amount,
      method,
      notes,
      transaction_type,
    } = req.body;

    if (transaction_type && !['income', 'expense'].includes(transaction_type)) {
      return res
        .status(400)
        .json({ error: "transaction_type must be 'income' or 'expense'" });
    }

    const updated = await prisma.financial_log.update({
      where: { id: parseInt(id) },
      data: {
        type_id: type_id ? parseInt(type_id) : undefined,
        student_id:
          student_id === null
            ? null
            : student_id
            ? parseInt(student_id)
            : undefined,
        course_id:
          course_id === null
            ? null
            : course_id
            ? parseInt(course_id)
            : undefined,
        amount: amount ? parseFloat(amount) : undefined,
        method,
        notes,
        transaction_type,
      },
    });

    res.status(200).json({ message: 'Financial log updated', updated });
  } catch (error) {
    console.error('Error updating financial log:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Delete financial log
exports.delete_financial_log = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.financial_log.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ message: 'Financial log deleted' });
  } catch (error) {
    console.error('Error deleting financial log:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
