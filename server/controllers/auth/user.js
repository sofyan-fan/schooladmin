const { prisma } = require('../../prisma/connection');

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
  res.status(200).json(req.user);
};

// Resolve the current logged-in student profile using session user email
// For student accounts, we store parent_email in the student table and use that to find the student
exports.get_current_student = async (req, res) => {
  try {
    const sessionUser = req.session?.user || req.user;
    if (!sessionUser || !sessionUser.email) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Only allow for student role; teachers/admins have no associated student
    if ((sessionUser.role || '').toLowerCase() !== 'student') {
      return res.status(403).json({ message: 'Forbidden' });
    }

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
