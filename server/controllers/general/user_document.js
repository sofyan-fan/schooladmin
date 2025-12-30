const { prisma } = require('../../prisma/connection');

function getSessionUser(req) {
  return req.session?.user || req.user || null;
}

async function resolveTeacherForSessionUser(sessionUser) {
  if (!sessionUser?.email) return null;

  // 1) Primary lookup: teacher linked by email === user email
  let teacher = await prisma.teacher.findFirst({
    where: { email: sessionUser.email },
  });

  // 2) Fallback for seeded users: derive first/last name from email pattern `first.last####@...`
  if (!teacher) {
    try {
      const localPart = String(sessionUser.email).split('@')[0] || '';
      const withoutDigits = localPart.replace(/\d+$/, '');
      const parts = withoutDigits.split('.').filter(Boolean);
      if (parts.length >= 2) {
        const firstName = parts[0].replace(/\b\w/g, (c) => c.toUpperCase());
        const lastName = parts
          .slice(1)
          .map((seg) => seg.replace(/\b\w/g, (c) => c.toUpperCase()))
          .join(' ');

        teacher = await prisma.teacher.findFirst({
          where: {
            first_name: firstName,
            last_name: lastName,
          },
        });
      }
    } catch {
      // ignore fallback parsing errors
    }
  }

  return teacher;
}

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
    await prisma.student_note.deleteMany({ where: { student_id: studentId } });

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

/* ==============================
   MENTOR TEACHER (own students)
============================== */

// GET students for the currently logged-in mentor teacher
// Only teachers who are mentors of a class can access this.
exports.get_mentor_students = async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser?.email || !sessionUser?.role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (String(sessionUser.role).toLowerCase() !== 'teacher') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const teacher = await resolveTeacherForSessionUser(sessionUser);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found for this user' });
    }

    const mentorClass = await prisma.class_layout.findFirst({
      where: { mentor_id: Number(teacher.id) },
      select: {
        id: true,
        name: true,
        mentor_id: true,
        course_id: true,
        school_year_id: true,
      },
    });

    if (!mentorClass) {
      return res.status(403).json({
        message: 'Only mentor teachers can view students.',
      });
    }

    const students = await prisma.student.findMany({
      where: { class_id: Number(mentorClass.id) },
      include: { class_layout: true },
      orderBy: [{ last_name: 'asc' }, { first_name: 'asc' }],
    });

    return res.status(200).json({ mentor_class: mentorClass, students });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error retrieving mentor students' });
  }
};
