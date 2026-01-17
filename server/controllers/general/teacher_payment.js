const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all approved but unpaid time registrations grouped by teacher
exports.get_approved_unpaid_registrations = async (req, res) => {
  try {
    // Get all approved but unpaid time registrations
    const registrations = await prisma.time_registration.findMany({
      where: {
        approved: true,
        paid: false,
      },
      include: {
        teacher: true,
      },
      orderBy: [
        { teacher_id: 'asc' },
        { week_start: 'desc' },
      ],
    });

    // Group by teacher and calculate totals
    const teacherMap = new Map();

    for (const reg of registrations) {
      const teacherId = reg.teacher_id;
      if (!teacherMap.has(teacherId)) {
        teacherMap.set(teacherId, {
          teacher: {
            id: reg.teacher.id,
            first_name: reg.teacher.first_name,
            last_name: reg.teacher.last_name,
            email: reg.teacher.email,
            compensation: reg.teacher.compensation || 0,
          },
          registrations: [],
          total_hours: 0,
          total_compensation: 0,
        });
      }

      const teacherData = teacherMap.get(teacherId);
      teacherData.registrations.push({
        id: reg.id,
        week_start: reg.week_start,
        week_end: reg.week_end,
        monday: reg.monday,
        tuesday: reg.tuesday,
        wednesday: reg.wednesday,
        thursday: reg.thursday,
        friday: reg.friday,
        saturday: reg.saturday,
        sunday: reg.sunday,
        total_hours: reg.total_hours,
        approved_at: reg.approved_at,
      });

      teacherData.total_hours += reg.total_hours;
      teacherData.total_compensation = teacherData.total_hours * teacherData.teacher.compensation;
    }

    const result = Array.from(teacherMap.values());

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching approved unpaid registrations:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Process teacher payment
exports.process_teacher_payment = async (req, res) => {
  try {
    const {
      teacher_id,
      registration_ids, // Array of time_registration IDs to pay
      confirmed_by, // Admin user ID
      notes,
      payment_method = 'Bankoverschrijving',
    } = req.body;

    if (!teacher_id || !registration_ids || registration_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'teacher_id and registration_ids are required',
      });
    }

    // Get the teacher with compensation rate
    const teacher = await prisma.teacher.findUnique({
      where: { id: parseInt(teacher_id) },
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    if (!teacher.compensation || teacher.compensation <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Teacher has no compensation rate set. Please set the hourly rate in the teacher profile first.',
      });
    }

    // Verify all registrations exist, are approved, and belong to this teacher
    const registrations = await prisma.time_registration.findMany({
      where: {
        id: { in: registration_ids.map((id) => parseInt(id)) },
        teacher_id: parseInt(teacher_id),
        approved: true,
        paid: false,
      },
    });

    if (registrations.length !== registration_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Some registrations are invalid, already paid, not approved, or do not belong to this teacher',
      });
    }

    // Calculate totals
    const totalHours = registrations.reduce((sum, r) => sum + r.total_hours, 0);
    const hourlyRate = teacher.compensation;
    const totalAmount = totalHours * hourlyRate;

    // Get active school year for financial log
    const activeSchoolYear = await prisma.school_year.findFirst({
      where: { is_active: true },
    });

    if (!activeSchoolYear) {
      return res.status(400).json({
        success: false,
        message: 'No active school year found. Please activate a school year first.',
      });
    }

    // Find or create the "Docentenbetaling" financial type
    let paymentType = await prisma.financial_type.findFirst({
      where: { name: 'Docentenbetaling' },
    });

    if (!paymentType) {
      paymentType = await prisma.financial_type.create({
        data: {
          name: 'Docentenbetaling',
          description: 'Betaling voor gewerkte uren van docenten',
        },
      });
    }

    // Use a transaction to ensure all updates are atomic
    const result = await prisma.$transaction(async (tx) => {
      // Create the financial log entry (expense)
      const financialLog = await tx.financial_log.create({
        data: {
          type_id: paymentType.id,
          amount: totalAmount,
          method: payment_method,
          notes: notes || `Betaling voor ${teacher.first_name} ${teacher.last_name}: ${totalHours} uren @ €${hourlyRate}/uur`,
          transaction_type: 'expense',
          school_year_id: activeSchoolYear.id,
        },
      });

      // Create the teacher payment record
      const payment = await tx.teacher_payment.create({
        data: {
          teacher_id: parseInt(teacher_id),
          total_hours: totalHours,
          hourly_rate: hourlyRate,
          total_amount: totalAmount,
          confirmed_by: parseInt(confirmed_by),
          financial_log_id: financialLog.id,
          notes: notes,
        },
      });

      // Update all time registrations to mark as paid
      await tx.time_registration.updateMany({
        where: {
          id: { in: registration_ids.map((id) => parseInt(id)) },
        },
        data: {
          paid: true,
          paid_at: new Date(),
          payment_id: payment.id,
        },
      });

      return {
        payment,
        financialLog,
      };
    });

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        payment_id: result.payment.id,
        financial_log_id: result.financialLog.id,
        total_hours: totalHours,
        hourly_rate: hourlyRate,
        total_amount: totalAmount,
        registrations_paid: registration_ids.length,
      },
    });
  } catch (error) {
    console.error('Error processing teacher payment:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get payment history for all teachers or a specific teacher
exports.get_payment_history = async (req, res) => {
  try {
    const { teacher_id } = req.query;

    const where = {};
    if (teacher_id) {
      where.teacher_id = parseInt(teacher_id);
    }

    const payments = await prisma.teacher_payment.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        financial_log: {
          include: {
            type: true,
          },
        },
        time_registrations: {
          select: {
            id: true,
            week_start: true,
            week_end: true,
            total_hours: true,
          },
        },
      },
      orderBy: {
        paid_at: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a single payment by ID with full details
exports.get_payment_by_id = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await prisma.teacher_payment.findUnique({
      where: { id: parseInt(id) },
      include: {
        teacher: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            compensation: true,
          },
        },
        financial_log: {
          include: {
            type: true,
          },
        },
        time_registrations: true,
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update teacher compensation rate
exports.update_teacher_compensation = async (req, res) => {
  try {
    const { id } = req.params;
    const { compensation } = req.body;

    if (compensation === undefined || compensation < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid compensation rate is required',
      });
    }

    const teacher = await prisma.teacher.update({
      where: { id: parseInt(id) },
      data: { compensation: parseFloat(compensation) },
    });

    res.status(200).json({
      success: true,
      message: 'Compensation rate updated',
      data: teacher,
    });
  } catch (error) {
    console.error('Error updating teacher compensation:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
