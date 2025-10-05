const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create an absence
exports.create_absence = async (req, res) => {
  try {
    const {
      user_id, // legacy from client; interpreted as student_id or teacher_id based on role
      role,
      roster_id,
      date,
      reason,
    } = req.body;

    // Teacher absence restriction
    if (role === 'teacher' && req.session.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Only admins can mark teacher absences',
      });
    }

    const absence = await prisma.absence.create({
      data: {
        student_id: role === 'student' ? user_id : null,
        teacher_id: role === 'teacher' ? user_id : null,
        role,
        roster_id,
        date: new Date(date),
        reason,
      },
    });
    console.log('absence', absence);
    res.status(201).json(absence);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Failed to create absence',
    });
  }
};

// Get all absences
exports.get_all_absences = async (req, res) => {
  try {
    const absences = await prisma.absence.findMany({
      include: {
        student: true,
        teacher: true,
        roster: {
          include: {
            class_layout: true,
            subject: true,
            teacher: true,
          },
        },
      },
    });

    res.status(200).json(absences);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Failed to fetch absences',
    });
  }
};

// Get absence by ID
exports.get_absence_by_id = async (req, res) => {
  try {
    const { id } = req.params;

    const absence = await prisma.absence.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        student: true,
        teacher: true,
        roster: {
          include: {
            class_layout: true,
            subject: true,
            teacher: true,
          },
        },
      },
    });

    if (!absence) {
      return res.status(404).json({
        error: 'Absence not found',
      });
    }

    res.status(200).json(absence);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Failed to fetch absence',
    });
  }
};

// Update an absence
exports.update_absence = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      user_id, // legacy from client; interpreted as student_id or teacher_id based on role
      role,
      roster_id,
      date,
      reason,
    } = req.body;

    // Teacher absence restriction
    if (role === 'teacher' && req.session.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Only admins can update teacher absences',
      });
    }

    const updatedAbsence = await prisma.absence.update({
      where: {
        id: Number(id),
      },
      data: {
        student_id: role === 'student' ? user_id : null,
        teacher_id: role === 'teacher' ? user_id : null,
        role,
        roster_id,
        date: date ? new Date(date) : undefined,
        reason,
      },
    });

    res.status(200).json(updatedAbsence);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Failed to update absence',
    });
  }
};

// Delete an absence
exports.delete_absence = async (req, res) => {
  try {
    const { id } = req.params;

    // Check role before deleting
    const absence = await prisma.absence.findUnique({
      where: {
        id: Number(id),
      },
    });
    if (!absence) {
      return res.status(404).json({
        error: 'Absence not found',
      });
    }

    if (absence.role === 'teacher' && req.session.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Only admins can delete teacher absences',
      });
    }

    await prisma.absence.delete({
      where: {
        id: Number(id),
      },
    });

    res.status(200).json({
      message: 'Absence deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Failed to delete absence',
    });
  }
};
// Helper function to validate daily hours
function validateDailyHours(hours) {
  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];
  for (let day of days) {
    if (hours[day] !== undefined && hours[day] > 24) {
      return `Invalid entry: ${day} cannot exceed 24 hours`;
    }
  }
  return null;
}

// Create a new time registration for a teacher
exports.create_time_registration = async (req, res) => {
  try {
    const {
      teacher_id,
      week_start,
      week_end,
      monday = 0,
      tuesday = 0,
      wednesday = 0,
      thursday = 0,
      friday = 0,
      saturday = 0,
      sunday = 0,
    } = req.body;

    // Validate daily hours
    const validationError = validateDailyHours({
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
    });
    if (validationError) {
      return res.status(403).json({ success: false, message: validationError });
    }

    const total_hours =
      monday + tuesday + wednesday + thursday + friday + saturday + sunday;

    const registration = await prisma.time_registration.create({
      data: {
        teacher_id,
        week_start: new Date(week_start),
        week_end: new Date(week_end),
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday,
        total_hours,
      },
    });

    res.status(201).json({
      success: true,
      data: registration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update hours for an existing time registration
exports.update_time_registration = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      monday = 0,
      tuesday = 0,
      wednesday = 0,
      thursday = 0,
      friday = 0,
      saturday = 0,
      sunday = 0,
    } = req.body;

    // Validate daily hours
    const validationError = validateDailyHours({
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
    });
    if (validationError) {
      return res.status(403).json({ success: false, message: validationError });
    }

    const total_hours =
      monday + tuesday + wednesday + thursday + friday + saturday + sunday;

    const registration = await prisma.time_registration.update({
      where: { id: parseInt(id) },
      data: {
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday,
        total_hours,
      },
    });

    res.status(200).json({
      success: true,
      data: registration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Approve a time registration
exports.approve_time_registration = async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_id } = req.body; // Ensure you validate this in middleware

    const registration = await prisma.time_registration.update({
      where: {
        id: parseInt(id),
      },
      data: {
        approved: true,
        approved_by: admin_id,
        approved_at: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      data: registration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all time registrations for a specific teacher
exports.get_teacher_time_registrations = async (req, res) => {
  try {
    const { teacher_id } = req.params;

    const registrations = await prisma.time_registration.findMany({
      where: {
        teacher_id: parseInt(teacher_id),
      },
      orderBy: {
        week_start: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: registrations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin: Get all time registrations
exports.get_all_time_registrations = async (req, res) => {
  try {
    const registrations = await prisma.time_registration.findMany({
      include: {
        teacher: true,
      },
      orderBy: {
        week_start: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: registrations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
