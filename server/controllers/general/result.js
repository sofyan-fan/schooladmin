const { prisma } = require('../../prisma/connection');

// Create a new result
exports.create_result = async (req, res) => {
  try {
    const { student_id, subject_id, grade, date } = req.body;

    const newResult = await prisma.result.create({
      data: {
        student_id: parseInt(student_id),
        subject_id: parseInt(subject_id),
        grade: parseFloat(grade),
        date: new Date(date),
      },
      include: {
        student: true,
        subject: true,
      },
    });

    return res.status(201).json(newResult);
  } catch (error) {
    console.error('Error creating result:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create result',
      error: error.message,
    });
  }
};

// Get all results
exports.get_all_results = async (req, res) => {
  try {
    const results = await prisma.result.findMany({
      include: {
        student: true,
        subject: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch results',
      error: error.message,
    });
  }
};

// Get a single result by ID
exports.get_result_by_id = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await prisma.result.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        student: true,
        subject: true,
      },
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found',
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching result:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch result',
      error: error.message,
    });
  }
};

// Update a result
exports.update_result = async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id, subject_id, grade, date } = req.body;

    const updateData = {};
    if (student_id !== undefined) updateData.student_id = parseInt(student_id);
    if (subject_id !== undefined) updateData.subject_id = parseInt(subject_id);
    if (grade !== undefined) updateData.grade = parseFloat(grade);
    if (date !== undefined) updateData.date = new Date(date);

    const updatedResult = await prisma.result.update({
      where: {
        id: parseInt(id),
      },
      data: updateData,
      include: {
        student: true,
        subject: true,
      },
    });

    return res.status(200).json(updatedResult);
  } catch (error) {
    console.error('Error updating result:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Result not found',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to update result',
      error: error.message,
    });
  }
};

// Delete a result
exports.delete_result = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.result.delete({
      where: {
        id: parseInt(id),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Result deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting result:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Result not found',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to delete result',
      error: error.message,
    });
  }
};
