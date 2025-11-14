const { prisma } = require('../../prisma/connection');

// Create a class layout
exports.create_class_layout = async (req, res) => {
  try {
    const { name, mentor_id, course_id, school_year_id } = req.body;
    let resolvedSchoolYearId = school_year_id ? parseInt(school_year_id) : null;
    if (!resolvedSchoolYearId && prisma.school_year && typeof prisma.school_year.findFirst === 'function') {
      const activeYear = await prisma.school_year.findFirst({ where: { is_active: true } });
      if (!activeYear) {
        return res.status(400).json({ message: 'No active school year. Provide school_year_id.' });
      }
      resolvedSchoolYearId = activeYear.id;
    }

    const newClassLayout = await prisma.class_layout.create({
      data: {
        name,
        ...(resolvedSchoolYearId != null ? { school_year_id: resolvedSchoolYearId } : {}),
        mentor_id: mentor_id || null,
        course_id: course_id || null,
      },
    });

    res.status(201).json({
      message: 'Class layout created',
      newClassLayout,
    });
  } catch (error) {
    console.error('Error creating class layout:', error);
    res.status(500).json({
      message: 'Failed to create class layout',
    });
  }
};

// Get all class layouts
exports.get_class_layouts = async (req, res) => {
  try {
    const where = {};
    if (req.query.school_year_id) {
      where.school_year_id = parseInt(req.query.school_year_id);
    } else if (prisma.school_year && typeof prisma.school_year.findFirst === 'function') {
      const activeYear = await prisma.school_year.findFirst({ where: { is_active: true } });
      if (activeYear) where.school_year_id = activeYear.id;
    }

    const classLayouts = await prisma.class_layout.findMany({
      where,
      include: {
        mentor: true,
        course: true,
        students: true,
      },
    });

    res.status(200).json(classLayouts);
  } catch (error) {
    console.error('Error fetching class layouts:', error);
    res.status(500).json({
      message: 'Failed to fetch class layouts',
    });
  }
};

// Get a single class layout
exports.get_class_layout = async (req, res) => {
  try {
    const { id } = req.params;

    const classLayout = await prisma.class_layout.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        mentor: true,
        course: true,
        students: true,
      },
    });

    if (!classLayout) {
      return res.status(404).json({
        message: 'Class layout not found',
      });
    }

    res.status(200).json(classLayout);
  } catch (error) {
    console.error('Error fetching class layout:', error);
    res.status(500).json({
      message: 'Failed to fetch class layout',
    });
  }
};

// Update class layout
exports.update_class_layout = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mentor_id, course_id } = req.body;

    const updatedClassLayout = await prisma.class_layout.update({
      where: {
        id: parseInt(id),
      },
      data: {
        name,
        mentor_id: mentor_id || null,
        course_id: course_id || null,
      },
    });

    res.status(200).json({
      message: 'Class layout updated',
      updatedClassLayout,
    });
  } catch (error) {
    console.error('Error updating class layout:', error);
    res.status(500).json({
      message: 'Failed to update class layout',
    });
  }
};

// Delete class layout
exports.delete_class_layout = async (req, res) => {
  try {
    const { id } = req.params;
    const classId = parseInt(id);

    // First, unassign all students from this class
    await prisma.student.updateMany({
      where: {
        class_id: classId,
      },
      data: {
        class_id: null,
      },
    });

    // Delete dependent records in safe order to satisfy FKs
    // 1) Absences linked via rosters of this class
    const rosters = await prisma.roster.findMany({
      where: { class_id: classId },
      select: { id: true },
    });
    const rosterIds = rosters.map((r) => r.id);
    if (rosterIds.length > 0) {
      await prisma.absence.deleteMany({
        where: { roster_id: { in: rosterIds } },
      });
    }

    // 2) Results -> Assessments belonging to this class
    const assessments = await prisma.assessment.findMany({
      where: { class_id: classId },
      select: { id: true },
    });
    const assessmentIds = assessments.map((a) => a.id);
    if (assessmentIds.length > 0) {
      await prisma.result.deleteMany({
        where: { assessment_id: { in: assessmentIds } },
      });
      await prisma.assessment.deleteMany({
        where: { id: { in: assessmentIds } },
      });
    }

    // 3) Schedules and Rosters for this class
    await prisma.schedule.deleteMany({
      where: { class_id: classId },
    });
    if (rosterIds.length > 0) {
      await prisma.roster.deleteMany({
        where: { id: { in: rosterIds } },
      });
    }

    // 4) Finally delete the class layout
    await prisma.class_layout.delete({
      where: {
        id: classId,
      },
    });

    res.status(200).json({
      message: 'Class layout deleted',
    });
  } catch (error) {
    console.error('Error deleting class layout:', error);
    res.status(500).json({
      message: 'Failed to delete class layout',
    });
  }
};

// Replace students in a class layout (unassign old ones, assign new ones)
exports.add_students_to_class = async (req, res) => {
  try {
    const { class_id } = req.params;
    const { student_ids } = req.body; // array of student IDs

    // First, unassign all current students from this class
    await prisma.student.updateMany({
      where: {
        class_id: parseInt(class_id),
      },
      data: {
        class_id: null,
      },
    });

    // Then assign the new students to this class
    if (student_ids && student_ids.length > 0) {
      const updates = await Promise.all(
        student_ids.map((studentId) =>
          prisma.student.update({
            where: {
              id: studentId,
            },
            data: {
              class_id: parseInt(class_id),
            },
          })
        )
      );

      res.status(200).json({
        message: 'Students updated in class',
        updates,
      });
    } else {
      res.status(200).json({
        message: 'All students removed from class',
      });
    }
  } catch (error) {
    console.error('Error updating students in class:', error);
    res.status(500).json({
      message: 'Failed to update students',
    });
  }
};

// Assign or change mentor (teacher)
exports.assign_mentor = async (req, res) => {
  try {
    const { class_id } = req.params;
    const { mentor_id } = req.body;

    const classId = parseInt(class_id);
    const mentorId = mentor_id == null ? null : parseInt(mentor_id);

    // Ensure a teacher can mentor only one class at a time
    if (mentorId != null) {
      await prisma.class_layout.updateMany({
        where: {
          mentor_id: mentorId,
          id: { not: classId },
        },
        data: {
          mentor_id: null,
        },
      });
    }

    const updatedClass = await prisma.class_layout.update({
      where: {
        id: classId,
      },
      data: {
        mentor_id: mentorId,
      },
    });

    res.status(200).json({
      message: 'Mentor assigned to class',
      updatedClass,
    });
  } catch (error) {
    console.error('Error assigning mentor:', error);
    res.status(500).json({
      message: 'Failed to assign mentor',
    });
  }
};
