const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==============================
// TEST CONTROLLERS
// ==============================

// Create a new test
exports.create_test = async (req, res) => {
  try {
    const {
      class_id,
      subject_id,
      date,
      description,
      name,
      maxScore,
      duration,
      weight,
    } = req.body;

    const newTest = await prisma.test.create({
      data: {
        class_id: parseInt(class_id),
        subject_id: parseInt(subject_id),
        date: new Date(date),
        description: description || '',
        // Store additional fields in description as JSON for now
        // since the schema doesn't have these fields
      },
      include: {
        class_layout: true,
        subject: true,
      },
    });

    // Format response to include the additional fields
    const formattedTest = {
      ...newTest,
      name: name || `Test ${newTest.id}`,
      maxScore: maxScore || 100,
      duration: duration || null,
      weight: weight || 1,
      classId: newTest.class_id,
      subjectId: newTest.subject_id,
    };

    return res.status(201).json(formattedTest);
  } catch (error) {
    console.error('Error creating test:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create test',
      error: error.message,
    });
  }
};

// Get all tests
exports.get_all_tests = async (req, res) => {
  try {
    const tests = await prisma.test.findMany({
      include: {
        class_layout: true,
        subject: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Format response
    const formattedTests = tests.map((test) => ({
      ...test,
      name: test.description
        ? test.description.split('|')[0]
        : `Test ${test.id}`,
      maxScore: 100,
      duration: null,
      weight: 1,
      classId: test.class_id,
      subjectId: test.subject_id,
    }));

    return res.status(200).json(formattedTests);
  } catch (error) {
    console.error('Error fetching tests:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tests',
      error: error.message,
    });
  }
};

// Get a single test by ID
exports.get_test_by_id = async (req, res) => {
  try {
    const { id } = req.params;

    const test = await prisma.test.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        class_layout: true,
        subject: true,
      },
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found',
      });
    }

    // Format response
    const formattedTest = {
      ...test,
      name: test.description
        ? test.description.split('|')[0]
        : `Test ${test.id}`,
      maxScore: 100,
      duration: null,
      weight: 1,
      classId: test.class_id,
      subjectId: test.subject_id,
    };

    return res.status(200).json(formattedTest);
  } catch (error) {
    console.error('Error fetching test:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch test',
      error: error.message,
    });
  }
};

// Update a test
exports.update_test = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      class_id,
      subject_id,
      date,
      description,
      name,
      maxScore,
      duration,
      weight,
    } = req.body;

    const updateData = {};
    if (class_id !== undefined) updateData.class_id = parseInt(class_id);
    if (subject_id !== undefined) updateData.subject_id = parseInt(subject_id);
    if (date !== undefined) updateData.date = new Date(date);
    if (description !== undefined || name !== undefined) {
      // Store name in description field as a workaround
      updateData.description = name || description || '';
    }

    const updatedTest = await prisma.test.update({
      where: {
        id: parseInt(id),
      },
      data: updateData,
      include: {
        class_layout: true,
        subject: true,
      },
    });

    // Format response
    const formattedTest = {
      ...updatedTest,
      name:
        name ||
        updatedTest.description?.split('|')[0] ||
        `Test ${updatedTest.id}`,
      maxScore: maxScore || 100,
      duration: duration || null,
      weight: weight || 1,
      classId: updatedTest.class_id,
      subjectId: updatedTest.subject_id,
    };

    return res.status(200).json(formattedTest);
  } catch (error) {
    console.error('Error updating test:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Test not found',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to update test',
      error: error.message,
    });
  }
};

// Delete a test
exports.delete_test = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.test.delete({
      where: {
        id: parseInt(id),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Test deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting test:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Test not found',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to delete test',
      error: error.message,
    });
  }
};

// ==============================
// EXAM CONTROLLERS
// ==============================

// Create a new exam
exports.create_exam = async (req, res) => {
  try {
    const {
      class_id,
      subject_id,
      date,
      is_central,
      name,
      description,
      maxScore,
      duration,
      weight,
    } = req.body;

    const newExam = await prisma.exam.create({
      data: {
        class_id: parseInt(class_id),
        subject_id: parseInt(subject_id),
        date: new Date(date),
        is_central: is_central || false,
      },
      include: {
        class_layout: true,
        subject: true,
      },
    });

    // Format response to include additional fields
    const formattedExam = {
      ...newExam,
      name: name || `Exam ${newExam.id}`,
      description: description || '',
      maxScore: maxScore || 100,
      duration: duration || null,
      weight: weight || 1,
      classId: newExam.class_id,
      subjectId: newExam.subject_id,
    };

    return res.status(201).json(formattedExam);
  } catch (error) {
    console.error('Error creating exam:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create exam',
      error: error.message,
    });
  }
};

// Get all exams
exports.get_all_exams = async (req, res) => {
  try {
    const exams = await prisma.exam.findMany({
      include: {
        class_layout: true,
        subject: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Format response
    const formattedExams = exams.map((exam) => ({
      ...exam,
      name: `Exam ${exam.id}`,
      description: '',
      maxScore: 100,
      duration: null,
      weight: 1,
      classId: exam.class_id,
      subjectId: exam.subject_id,
    }));

    return res.status(200).json(formattedExams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch exams',
      error: error.message,
    });
  }
};

// Get a single exam by ID
exports.get_exam_by_id = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await prisma.exam.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        class_layout: true,
        subject: true,
      },
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    // Format response
    const formattedExam = {
      ...exam,
      name: `Exam ${exam.id}`,
      description: '',
      maxScore: 100,
      duration: null,
      weight: 1,
      classId: exam.class_id,
      subjectId: exam.subject_id,
    };

    return res.status(200).json(formattedExam);
  } catch (error) {
    console.error('Error fetching exam:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch exam',
      error: error.message,
    });
  }
};

// Update an exam
exports.update_exam = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      class_id,
      subject_id,
      date,
      is_central,
      name,
      description,
      maxScore,
      duration,
      weight,
    } = req.body;

    const updateData = {};
    if (class_id !== undefined) updateData.class_id = parseInt(class_id);
    if (subject_id !== undefined) updateData.subject_id = parseInt(subject_id);
    if (date !== undefined) updateData.date = new Date(date);
    if (is_central !== undefined) updateData.is_central = is_central;

    const updatedExam = await prisma.exam.update({
      where: {
        id: parseInt(id),
      },
      data: updateData,
      include: {
        class_layout: true,
        subject: true,
      },
    });

    // Format response
    const formattedExam = {
      ...updatedExam,
      name: name || `Exam ${updatedExam.id}`,
      description: description || '',
      maxScore: maxScore || 100,
      duration: duration || null,
      weight: weight || 1,
      classId: updatedExam.class_id,
      subjectId: updatedExam.subject_id,
    };

    return res.status(200).json(formattedExam);
  } catch (error) {
    console.error('Error updating exam:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to update exam',
      error: error.message,
    });
  }
};

// Delete an exam
exports.delete_exam = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.exam.delete({
      where: {
        id: parseInt(id),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Exam deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting exam:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to delete exam',
      error: error.message,
    });
  }
};



