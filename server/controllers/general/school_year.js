const { prisma } = require('../../prisma/connection');

// Create a new school year and archive current data
exports.create_school_year = async (req, res) => {
  try {
    const { name, start_date, end_date } = req.body;

    if (!name || !start_date) {
      return res.status(400).json({
        message: 'Name and start_date are required',
      });
    }

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get the current active school year (if any)
      const currentActiveYear = await tx.school_year.findFirst({
        where: { is_active: true },
      });

      // Archive all current data (including null school_year_id) to the current active year
      // If there's an active year, archive all null records to it before deactivating
      if (currentActiveYear) {
        // Archive all data with null school_year_id to the current active year
        await tx.student.updateMany({
          where: { school_year_id: null },
          data: { school_year_id: currentActiveYear.id },
        });

        await tx.class_layout.updateMany({
          where: { school_year_id: null },
          data: { school_year_id: currentActiveYear.id },
        });

        await tx.assessment.updateMany({
          where: { school_year_id: null },
          data: { school_year_id: currentActiveYear.id },
        });

        await tx.result.updateMany({
          where: { school_year_id: null },
          data: { school_year_id: currentActiveYear.id },
        });

        await tx.progress.updateMany({
          where: { school_year_id: null },
          data: { school_year_id: currentActiveYear.id },
        });

        await tx.absence.updateMany({
          where: { school_year_id: null },
          data: { school_year_id: currentActiveYear.id },
        });

        await tx.schedule.updateMany({
          where: { school_year_id: null },
          data: { school_year_id: currentActiveYear.id },
        });

        await tx.roster.updateMany({
          where: { school_year_id: null },
          data: { school_year_id: currentActiveYear.id },
        });

        await tx.tuition_payment.updateMany({
          where: { school_year_id: null },
          data: { school_year_id: currentActiveYear.id },
        });

        await tx.financial_log.updateMany({
          where: { school_year_id: null },
          data: { school_year_id: currentActiveYear.id },
        });

        await tx.student_log.updateMany({
          where: { school_year_id: null },
          data: { school_year_id: currentActiveYear.id },
        });

        await tx.time_registration.updateMany({
          where: { school_year_id: null },
          data: { school_year_id: currentActiveYear.id },
        });

        await tx.events.updateMany({
          where: { school_year_id: null },
          data: { school_year_id: currentActiveYear.id },
        });

        // Deactivate the current active year
        await tx.school_year.update({
          where: { id: currentActiveYear.id },
          data: { is_active: false },
        });
      }

      // Create new school year
      const newSchoolYear = await tx.school_year.create({
        data: {
          name,
          start_date: new Date(start_date),
          end_date: end_date ? new Date(end_date) : null,
          is_active: true,
        },
      });

      return newSchoolYear;
    });

    res.status(201).json({
      message: 'School year created and data archived successfully',
      school_year: result,
    });
  } catch (error) {
    console.error('Error creating school year:', error);
    res.status(500).json({
      message: 'Failed to create school year',
      error: error.message,
    });
  }
};

// Get all school years
exports.get_all_school_years = async (req, res) => {
  try {
    const schoolYears = await prisma.school_year.findMany({
      orderBy: {
        start_date: 'desc',
      },
    });

    res.status(200).json(schoolYears);
  } catch (error) {
    console.error('Error fetching school years:', error);
    res.status(500).json({
      message: 'Failed to fetch school years',
      error: error.message,
    });
  }
};

// Get a specific school year by ID
exports.get_school_year = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolYearId = parseInt(id);

    if (isNaN(schoolYearId)) {
      return res.status(400).json({
        message: 'Invalid school year ID',
      });
    }

    const schoolYear = await prisma.school_year.findUnique({
      where: { id: schoolYearId },
      include: {
        students: true,
        class_layouts: true,
        assessments: true,
        results: true,
        progress: true,
        absences: true,
        schedules: true,
        rosters: true,
        tuition_payments: true,
        financial_logs: true,
        student_logs: true,
        time_registrations: true,
        events: true,
      },
    });

    if (!schoolYear) {
      return res.status(404).json({
        message: 'School year not found',
      });
    }

    res.status(200).json(schoolYear);
  } catch (error) {
    console.error('Error fetching school year:', error);
    res.status(500).json({
      message: 'Failed to fetch school year',
      error: error.message,
    });
  }
};

// Set active school year
exports.set_active_school_year = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolYearId = parseInt(id);

    if (isNaN(schoolYearId)) {
      return res.status(400).json({
        message: 'Invalid school year ID',
      });
    }

    // Check if school year exists
    const schoolYear = await prisma.school_year.findUnique({
      where: { id: schoolYearId },
    });

    if (!schoolYear) {
      return res.status(404).json({
        message: 'School year not found',
      });
    }

    // Deactivate all school years and activate the selected one
    await prisma.$transaction(async (tx) => {
      await tx.school_year.updateMany({
        where: { is_active: true },
        data: { is_active: false },
      });

      await tx.school_year.update({
        where: { id: schoolYearId },
        data: { is_active: true },
      });
    });

    res.status(200).json({
      message: 'Active school year updated',
    });
  } catch (error) {
    console.error('Error setting active school year:', error);
    res.status(500).json({
      message: 'Failed to set active school year',
      error: error.message,
    });
  }
};

// Archive current data (assign all null school_year_id records to current active year)
// This is used when creating a new school year to ensure all data is properly archived
exports.archive_current_data = async (req, res) => {
  try {
    // Get current active school year
    const activeYear = await prisma.school_year.findFirst({
      where: { is_active: true },
    });

    if (!activeYear) {
      return res.status(400).json({
        message: 'No active school year found. Please create a school year first.',
      });
    }

    // Archive all data with null school_year_id to the current active year
    await prisma.$transaction(async (tx) => {
      // Update all archivable models
      await tx.student.updateMany({
        where: { school_year_id: null },
        data: { school_year_id: activeYear.id },
      });

      await tx.class_layout.updateMany({
        where: { school_year_id: null },
        data: { school_year_id: activeYear.id },
      });

      await tx.assessment.updateMany({
        where: { school_year_id: null },
        data: { school_year_id: activeYear.id },
      });

      await tx.result.updateMany({
        where: { school_year_id: null },
        data: { school_year_id: activeYear.id },
      });

      await tx.progress.updateMany({
        where: { school_year_id: null },
        data: { school_year_id: activeYear.id },
      });

      await tx.absence.updateMany({
        where: { school_year_id: null },
        data: { school_year_id: activeYear.id },
      });

      await tx.schedule.updateMany({
        where: { school_year_id: null },
        data: { school_year_id: activeYear.id },
      });

      await tx.roster.updateMany({
        where: { school_year_id: null },
        data: { school_year_id: activeYear.id },
      });

      await tx.tuition_payment.updateMany({
        where: { school_year_id: null },
        data: { school_year_id: activeYear.id },
      });

      await tx.financial_log.updateMany({
        where: { school_year_id: null },
        data: { school_year_id: activeYear.id },
      });

      await tx.student_log.updateMany({
        where: { school_year_id: null },
        data: { school_year_id: activeYear.id },
      });

      await tx.time_registration.updateMany({
        where: { school_year_id: null },
        data: { school_year_id: activeYear.id },
      });

      await tx.events.updateMany({
        where: { school_year_id: null },
        data: { school_year_id: activeYear.id },
      });
    });

    res.status(200).json({
      message: 'Current data archived successfully',
      school_year_id: activeYear.id,
    });
  } catch (error) {
    console.error('Error archiving data:', error);
    res.status(500).json({
      message: 'Failed to archive data',
      error: error.message,
    });
  }
};

