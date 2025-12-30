const { prisma } = require('../../prisma/connection');

function getSessionUser(req) {
  return req.session?.user || req.user || null;
}

function normalizeEmail(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

function normalizeString(value) {
  if (typeof value !== 'string') return undefined;
  return value.trim();
}

async function resolveStudentForSessionUser(sessionUser) {
  // 1) Primary lookup: student linked by parent_email === user email (manual registrations)
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

exports.get_users = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
};

exports.get_user = async (req, res) => {
  // NOTE: this project authenticates via express-session; req.user may be unset.
  const sessionUser = getSessionUser(req);
  if (!sessionUser) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  return res.status(200).json(sessionUser);
};

// Resolve the current logged-in student profile using session user email
// For student accounts, we store parent_email in the student table and use that to find the student
exports.get_current_student = async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || !sessionUser.email) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Only allow for student role; teachers/admins have no associated student
    if ((sessionUser.role || '').toLowerCase() !== 'student') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const student = await resolveStudentForSessionUser(sessionUser);

    if (!student) {
      return res
        .status(404)
        .json({ message: 'Student not found for this user' });
    }

    return res.status(200).json(student);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Resolve the current logged-in teacher profile using session user email
exports.get_current_teacher = async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || !sessionUser.email) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if ((sessionUser.role || '').toLowerCase() !== 'teacher') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const teacher = await resolveTeacherForSessionUser(sessionUser);
    if (!teacher) {
      return res
        .status(404)
        .json({ message: 'Teacher not found for this user' });
    }

    return res.status(200).json(teacher);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Update contact info for the current logged-in student (NO password changes here)
exports.update_current_student_contact = async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || !sessionUser.email || !sessionUser.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if ((sessionUser.role || '').toLowerCase() !== 'student') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const student = await resolveStudentForSessionUser(sessionUser);
    if (!student) {
      return res
        .status(404)
        .json({ message: 'Student not found for this user' });
    }

    const newEmail =
      normalizeEmail(req.body?.email) || normalizeEmail(req.body?.parent_email);

    const studentData = {};
    const address = normalizeString(req.body?.address);
    const postalCode = normalizeString(req.body?.postal_code);
    const city = normalizeString(req.body?.city);
    const phone = normalizeString(req.body?.phone);
    const parentName = normalizeString(req.body?.parent_name);
    const sosnumber = normalizeString(req.body?.sosnumber);

    if (address !== undefined) studentData.address = address;
    if (postalCode !== undefined) studentData.postal_code = postalCode;
    if (city !== undefined) studentData.city = city;
    if (phone !== undefined) studentData.phone = phone;
    if (parentName !== undefined) studentData.parent_name = parentName;
    if (sosnumber !== undefined) studentData.sosnumber = sosnumber;

    const emailChanged = Boolean(newEmail) && newEmail !== sessionUser.email;

    if (emailChanged) {
      studentData.parent_email = newEmail;

      const [, updatedStudent] = await prisma.$transaction([
        prisma.user.update({
          where: { id: Number(sessionUser.id) },
          data: { email: newEmail },
        }),
        prisma.student.update({
          where: { id: Number(student.id) },
          data: studentData,
        }),
      ]);

      // Keep the active session consistent for subsequent /me lookups
      req.session.user.email = newEmail;

      return res.status(200).json({
        message: 'Contact updated',
        user: req.session.user,
        profile: updatedStudent,
      });
    }

    const updatedStudent = await prisma.student.update({
      where: { id: Number(student.id) },
      data: studentData,
    });

    return res.status(200).json({
      message: 'Contact updated',
      user: req.session.user,
      profile: updatedStudent,
    });
  } catch (error) {
    console.error(error);
    if (error?.code === 'P2002') {
      return res.status(409).json({ message: 'Email already in use' });
    }
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Update contact info for the current logged-in teacher (NO password changes here)
exports.update_current_teacher_contact = async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || !sessionUser.email || !sessionUser.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if ((sessionUser.role || '').toLowerCase() !== 'teacher') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const teacher = await resolveTeacherForSessionUser(sessionUser);
    if (!teacher) {
      return res
        .status(404)
        .json({ message: 'Teacher not found for this user' });
    }

    const newEmail = normalizeEmail(req.body?.email);

    const teacherData = {};
    const address = normalizeString(req.body?.address);
    const phone = normalizeString(req.body?.phone);
    const sosnumber = normalizeString(req.body?.sosnumber);

    if (address !== undefined) teacherData.address = address;
    if (phone !== undefined) teacherData.phone = phone;
    if (sosnumber !== undefined) teacherData.sosnumber = sosnumber;

    const emailChanged = Boolean(newEmail) && newEmail !== sessionUser.email;

    if (emailChanged) {
      teacherData.email = newEmail;

      const [, updatedTeacher] = await prisma.$transaction([
        prisma.user.update({
          where: { id: Number(sessionUser.id) },
          data: { email: newEmail },
        }),
        prisma.teacher.update({
          where: { id: Number(teacher.id) },
          data: teacherData,
        }),
      ]);

      req.session.user.email = newEmail;

      return res.status(200).json({
        message: 'Contact updated',
        user: req.session.user,
        profile: updatedTeacher,
      });
    }

    const updatedTeacher = await prisma.teacher.update({
      where: { id: Number(teacher.id) },
      data: teacherData,
    });

    return res.status(200).json({
      message: 'Contact updated',
      user: req.session.user,
      profile: updatedTeacher,
    });
  } catch (error) {
    console.error(error);
    if (error?.code === 'P2002') {
      return res.status(409).json({ message: 'Email already in use' });
    }
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.update_enrollment = async (req, res) => {
  const { student_id } = req.params;

  const { enrollment_status } = req.body;

  try {
    const student = await prisma.student.update({
      where: {
        id: parseInt(student_id),
      },
      data: {
        enrollment_status,
      },
    });

    res.status(200).json({
      message: 'Enrollment status updated successfully',
      student,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
};
