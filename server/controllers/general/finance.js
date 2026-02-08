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
      school_year_id,
    } = req.body;

    if (!['income', 'expense'].includes(transaction_type)) {
      return res
        .status(400)
        .json({ error: "transaction_type must be 'income' or 'expense'" });
    }

    let resolvedSchoolYearId = school_year_id ? parseInt(school_year_id) : null;
    if (!resolvedSchoolYearId && prisma.school_year && typeof prisma.school_year.findFirst === 'function') {
      const activeYear = await prisma.school_year.findFirst({ where: { is_active: true } });
      if (!activeYear) {
        return res.status(400).json({ error: 'No active school year. Provide school_year_id.' });
      }
      resolvedSchoolYearId = activeYear.id;
    }

    const parsedAmount = parseFloat(amount);

    const log = await prisma.financial_log.create({
      data: {
        type_id: parseInt(type_id),
        student_id: student_id ? parseInt(student_id) : null,
        course_id: course_id ? parseInt(course_id) : null,
        amount: parsedAmount,
        method,
        notes,
        transaction_type,
        ...(resolvedSchoolYearId != null ? { school_year_id: resolvedSchoolYearId } : {}),
      },
      include: {
        type: true,
        student: { select: { first_name: true, last_name: true } },
        course: { select: { name: true } },
      },
    });

    // Update saldo: income adds, expense subtracts
    const budgetDelta = transaction_type === 'income' ? parsedAmount : -parsedAmount;
    const budget = await prisma.finance_budget.findFirst();
    if (budget) {
      await prisma.finance_budget.update({
        where: { id: budget.id },
        data: { amount: { increment: budgetDelta } },
      });
    }

    res.status(201).json({ message: 'Financial log created', log });
  } catch (error) {
    console.error('Error creating financial log:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get all financial logs
exports.get_financial_logs = async (req, res) => {
  try {
    const where = {};
    if (req.query.school_year_id) {
      where.school_year_id = parseInt(req.query.school_year_id, 10);
    } else if (
      prisma.school_year &&
      typeof prisma.school_year.findFirst === 'function'
    ) {
      const activeYear = await prisma.school_year.findFirst({
        where: { is_active: true },
      });
      if (activeYear) where.school_year_id = activeYear.id;
    }

    if (req.query.student_id) {
      where.student_id = parseInt(req.query.student_id, 10);
    }

    const logs = await prisma.financial_log.findMany({
      where,
      include: {
        type: true,
        student: { select: { first_name: true, last_name: true } },
        course: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });

    const formatted = logs.map((log) => ({
      id: log.id,
      student_id: log.student_id,
      course_id: log.course_id,
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

    // Read original log to calculate saldo diff
    const original = await prisma.financial_log.findUnique({
      where: { id: parseInt(id) },
    });
    if (!original) {
      return res.status(404).json({ error: 'Financial log not found' });
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

    // Adjust saldo: reverse old impact, apply new impact
    const oldImpact = original.transaction_type === 'income' ? original.amount : -original.amount;
    const newType = transaction_type || original.transaction_type;
    const newAmount = amount ? parseFloat(amount) : original.amount;
    const newImpact = newType === 'income' ? newAmount : -newAmount;
    const delta = newImpact - oldImpact;

    if (delta !== 0) {
      const budget = await prisma.finance_budget.findFirst();
      if (budget) {
        await prisma.finance_budget.update({
          where: { id: budget.id },
          data: { amount: { increment: delta } },
        });
      }
    }

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

    // Read the log first to reverse the saldo impact
    const log = await prisma.financial_log.findUnique({
      where: { id: parseInt(id) },
    });
    if (!log) {
      return res.status(404).json({ error: 'Financial log not found' });
    }

    await prisma.financial_log.delete({ where: { id: parseInt(id) } });

    // Reverse saldo: undo what the original transaction did
    const reverseDelta = log.transaction_type === 'income' ? -log.amount : log.amount;
    const budget = await prisma.finance_budget.findFirst();
    if (budget) {
      await prisma.finance_budget.update({
        where: { id: budget.id },
        data: { amount: { increment: reverseDelta } },
      });
    }

    res.status(200).json({ message: 'Financial log deleted' });
  } catch (error) {
    console.error('Error deleting financial log:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
