const { prisma } = require('../../prisma/connection');

function getSessionUser(req) {
  return req.session?.user || req.user || null;
}

function normalizeString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseNumericId(value, fieldName) {
  const raw = String(value ?? '').trim();
  if (!/^\d+$/.test(raw)) {
    const err = new Error(`${fieldName} must be a numeric id.`);
    err.statusCode = 400;
    throw err;
  }
  return Number(raw);
}

async function resolveStudentForSessionUser(sessionUser) {
  if (!sessionUser?.email) return null;

  // 1) Primary lookup: student linked by parent_email === user email
  let student = await prisma.student.findFirst({
    where: { parent_email: sessionUser.email },
  });

  // 2) Fallback for seeded users: derive first/last name from email pattern `first.last####@...`
  if (!student) {
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

        student = await prisma.student.findFirst({
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

  return student;
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

// GET /api/general/students/:student_id/notes
// - teacher: only notes authored by this teacher (privacy)
// - student: all notes addressed to themselves (privacy)
exports.get_student_notes = async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser?.id || !sessionUser?.role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const role = String(sessionUser.role).toLowerCase();
    const studentId = parseNumericId(req.params.student_id, 'student_id');

    // Only teacher and student can access these notes.
    if (role !== 'teacher' && role !== 'student') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (role === 'student') {
      const student = await resolveStudentForSessionUser(sessionUser);
      if (!student) {
        return res.status(404).json({ message: 'Student not found for this user' });
      }
      if (Number(student.id) !== studentId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    if (role === 'teacher') {
      // Only mentor teachers can access notes, and only for students in their mentored class.
      const teacher = await resolveTeacherForSessionUser(sessionUser);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found for this user' });
      }

      const mentorClass = await prisma.class_layout.findFirst({
        where: { mentor_id: Number(teacher.id) },
        select: { id: true },
      });
      if (!mentorClass) {
        return res.status(403).json({
          message: 'Only mentor teachers can view student notes.',
        });
      }

      const targetStudent = await prisma.student.findUnique({
        where: { id: studentId },
        select: { id: true, class_id: true },
      });
      if (!targetStudent) {
        return res.status(404).json({ message: 'Student not found' });
      }
      if (Number(targetStudent.class_id) !== Number(mentorClass.id)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    const where =
      role === 'teacher'
        ? {
          student_id: studentId,
          author_id: Number(sessionUser.id),
        }
        : {
          student_id: studentId,
        };

    const notes = await prisma.student_note.findMany({
      where,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        student_id: true,
        author_id: true,
        subject: true,
        text: true,
        created_at: true,
      },
    });

    return res.status(200).json(notes);
  } catch (error) {
    if (error?.statusCode === 400) {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch student notes.' });
  }
};

// POST /api/general/students/:student_id/notes
// Only teachers can create notes. Notes are private: only the author-teacher and the recipient-student can read.
exports.create_student_note = async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser?.id || !sessionUser?.role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const role = String(sessionUser.role).toLowerCase();
    if (role !== 'teacher') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const studentId = parseNumericId(req.params.student_id, 'student_id');
    const subjectRaw = normalizeString(req.body?.subject);
    const textRaw = normalizeString(req.body?.text);

    if (!textRaw) {
      return res.status(400).json({ message: 'Text is required.' });
    }

    // NOTE: Prisma default for MySQL strings is VARCHAR(191). Enforce length to avoid DB errors.
    const subject = (subjectRaw || 'Notitie').slice(0, 191);
    const text = textRaw.slice(0, 191);

    const targetStudent = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, class_id: true },
    });
    if (!targetStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Only mentor teachers can create notes, and only for students in their mentored class.
    const teacher = await resolveTeacherForSessionUser(sessionUser);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found for this user' });
    }

    const mentorClass = await prisma.class_layout.findFirst({
      where: { mentor_id: Number(teacher.id) },
      select: { id: true },
    });
    if (!mentorClass) {
      return res.status(403).json({
        message: 'Only mentor teachers can create student notes.',
      });
    }
    if (Number(targetStudent.class_id) !== Number(mentorClass.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const created = await prisma.student_note.create({
      data: {
        student_id: studentId,
        author_id: Number(sessionUser.id),
        subject,
        text,
      },
      select: {
        id: true,
        student_id: true,
        author_id: true,
        subject: true,
        text: true,
        created_at: true,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    if (error?.statusCode === 400) {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: 'Failed to create student note.' });
  }
};


