const { prisma } = require('../../prisma/connection');

/* ==============================
   TEACHERS
============================== */

// GET all teachers
exports.get_all_teachers = async (req, res) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        absences: true,
        roster: {
          include: {
            class_layout: true,
            subject: true,
          },
        },
        // Include classes where this teacher is the mentor
        class_layout: true,
      },
    });
    res.status(200).json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error retrieving teachers' });
  }
};

// CREATE teacher
exports.create_teacher = async (req, res) => {
  try {
    const teacher = await prisma.teacher.create({
      data: req.body,
    });
    res.status(201).json(teacher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating teacher' });
  }
};

// UPDATE teacher
exports.update_teacher = async (req, res) => {
  try {
    const teacher = await prisma.teacher.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.status(200).json(teacher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating teacher' });
  }
};

// DELETE teacher
exports.delete_teacher = async (req, res) => {
  try {
    await prisma.teacher.delete({
      where: { id: Number(req.params.id) },
    });
    res.status(200).json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting teacher' });
  }
};

/* ==============================
   STUDENTS
============================== */

// GET all students
exports.get_all_students = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        class_layout: true,
        progress: true,
        absences: true,
        payments: {
          include: { course: true },
        },
        results: true,
      },
    });
    res.status(200).json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error retrieving students' });
  }
};

// GET student by ID
exports.get_student_by_id = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching student' });
  }
};

// SEARCH students
exports.search_students = async (req, res) => {
  try {
    const { query } = req.query;
    const students = await prisma.student.findMany({
      where: {
        OR: [
          { first_name: { contains: query, mode: 'insensitive' } },
          { last_name: { contains: query, mode: 'insensitive' } },
        ],
      },
    });
    res.status(200).json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error searching students' });
  }
};

// CREATE student
exports.create_student = async (req, res) => {
  try {
    const student = await prisma.student.create({
      data: req.body,
    });
    res.status(201).json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating student' });
  }
};

// UPDATE student
exports.update_student = async (req, res) => {
  try {
    const student = await prisma.student.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.status(200).json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating student' });
  }
};

// DELETE student
exports.delete_student = async (req, res) => {
  try {
    const studentId = Number(req.params.id);

    // Cleanup dependent data to satisfy foreign keys
    await prisma.result.deleteMany({ where: { student_id: studentId } });
    await prisma.absence.deleteMany({ where: { student_id: studentId } });
    await prisma.progress.deleteMany({ where: { student_id: studentId } });
    await prisma.tuition_payment.deleteMany({
      where: { student_id: studentId },
    });
    await prisma.student_log.deleteMany({ where: { student_id: studentId } });

    await prisma.student.delete({ where: { id: studentId } });

    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.status(500).json({ error: 'Error deleting student' });
  }
};
