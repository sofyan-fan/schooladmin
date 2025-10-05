const { prisma } = require('../../prisma/connection');

// Create a classroom
exports.create_classroom = async (req, res) => {
  try {
    const { name, capacity, description } = req.body;

    const classroom = await prisma.classroom.create({
      data: {
        name,
        capacity,
        description,
      },
    });

    res.status(201).json({
      message: 'Classroom created successfully',
      classroom,
    });
  } catch (error) {
    console.error('Error creating classroom:', error);

    // Handle unique constraint violation
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return res.status(400).json({
        error: 'A classroom with this name already exists',
      });
    }

    res.status(500).json({
      error: 'Failed to create classroom',
    });
  }
};

// Get all classrooms
exports.get_classrooms = async (req, res) => {
  try {
    const classrooms = await prisma.classroom.findMany({
      include: {
        schedules: true,
        rosters: true,
      },
    });

    res.status(200).json(classrooms);
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    res.status(500).json({
      error: 'Failed to fetch classrooms',
    });
  }
};

// Get single classroom by ID
exports.get_classroom = async (req, res) => {
  try {
    const { id } = req.params;

    const classroom = await prisma.classroom.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        schedules: true,
        rosters: true,
      },
    });

    if (!classroom) {
      return res.status(404).json({
        error: 'Classroom not found',
      });
    }

    res.status(200).json(classroom);
  } catch (error) {
    console.error('Error fetching classroom:', error);
    res.status(500).json({
      error: 'Failed to fetch classroom',
    });
  }
};

// Update classroom
exports.update_classroom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, description } = req.body;

    const updatedClassroom = await prisma.classroom.update({
      where: {
        id: parseInt(id),
      },
      data: {
        name,
        capacity,
        description,
      },
    });

    res.status(200).json({
      message: 'Classroom updated successfully',
      updatedClassroom,
    });
  } catch (error) {
    console.error('Error updating classroom:', error);

    // Handle unique constraint violation
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return res.status(400).json({
        error: 'A classroom with this name already exists',
      });
    }

    res.status(500).json({
      error: 'Failed to update classroom',
    });
  }
};

// Delete classroom
exports.delete_classroom = async (req, res) => {
  try {
    const { id } = req.params;

    const classroomId = parseInt(id);

    // Remove rosters (and their absences) for this classroom before deletion
    const rosters = await prisma.roster.findMany({
      where: { classroom_id: classroomId },
      select: { id: true },
    });
    const rosterIds = rosters.map((r) => r.id);
    if (rosterIds.length > 0) {
      await prisma.absence.deleteMany({
        where: { roster_id: { in: rosterIds } },
      });
      await prisma.roster.deleteMany({ where: { id: { in: rosterIds } } });
    }

    await prisma.classroom.delete({
      where: {
        id: classroomId,
      },
    });

    res.status(200).json({
      message: 'Classroom deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting classroom:', error);
    res.status(500).json({
      error: 'Failed to delete classroom',
    });
  }
};
