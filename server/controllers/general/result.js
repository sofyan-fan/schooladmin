const { prisma } = require('../../prisma/connection');

function getSessionUser(req) {
  return req.session?.user || req.user || null;
}

async function resolveTeacherForSessionUser(sessionUser) {
  if (!sessionUser?.email) return null;

  // Primary lookup: teacher linked by email === user email
  let teacher = await prisma.teacher.findFirst({
    where: { email: sessionUser.email },
  });

  // Fallback for seeded users: derive first/last name from email pattern `first.last####@...`
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

async function resolveActiveSchoolYearId() {
  if (!prisma.school_year || typeof prisma.school_year.findFirst !== 'function') {
    return null;
  }
  const activeYear = await prisma.school_year.findFirst({
    where: { is_active: true },
    select: { id: true },
  });
  return activeYear?.id ?? null;
}

// CREATE a result (uses upsert to prevent duplicates)
// If a result already exists for the same student_id and assessment_id, update it instead
exports.create_result = async (req, res) => {
  try {
    const { student_id, assessment_id, grade, date } = req.body;

    // Check if a result already exists for this student and assessment
    const existingResult = await prisma.result.findFirst({
      where: {
        student_id: parseInt(student_id),
        assessment_id: parseInt(assessment_id),
      },
    });

    let result;
    if (existingResult) {
      // Update the existing result instead of creating a duplicate
      result = await prisma.result.update({
        where: { id: existingResult.id },
        data: {
          grade,
          date: new Date(date),
        },
      });
    } else {
      // Create a new result
      result = await prisma.result.create({
        data: {
          student: { connect: { id: parseInt(student_id) } },
          assessment: { connect: { id: parseInt(assessment_id) } },
          grade,
          date: new Date(date),
        },
      });
    }

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'failed_to_create_result' });
  }
};

// READ all results
exports.get_all_results = async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);
    const role = String(sessionUser?.role || '').toLowerCase();

    // Teacher restriction: only results for this teacher's rosters (class + subject), and for their students.
    if (role === 'teacher') {
      const teacher = await resolveTeacherForSessionUser(sessionUser);
      if (!teacher) {
        return res.json([]);
      }

      const yearId = req.query.school_year_id
        ? parseInt(req.query.school_year_id)
        : await resolveActiveSchoolYearId();

      const rosterWhere = { teacher_id: Number(teacher.id) };
      if (yearId) rosterWhere.school_year_id = Number(yearId);

      const rosters = await prisma.roster.findMany({
        where: rosterWhere,
        select: { class_id: true, subject_id: true },
      });

      if (!rosters.length) {
        return res.json([]);
      }

      const where = {
        OR: rosters.map((r) => ({
          student: { class_id: r.class_id },
          assessment: {
            ...(yearId ? { school_year_id: Number(yearId) } : {}),
            class_id: r.class_id,
            subject: { subject_id: r.subject_id },
          },
        })),
      };

      const results = await prisma.result.findMany({
        where,
        include: {
          student: true,
          assessment: {
            include: {
              class_layout: true,
              subject: {
                include: {
                  subject: true,
                  course_module: true,
                },
              },
            },
          },
        },
      });

      return res.json(results);
    }

    const results = await prisma.result.findMany({
      include: {
        student: true,
        assessment: {
          include: {
            class_layout: true,
            subject: {
              include: {
                subject: true, 
                course_module: true, 
              },
            },
          },
        },
      },
    });

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'failed_to_fetch_results' });
  }
};

// READ single result
exports.get_result_by_id = async (req, res) => {
  try {
    const { id } = req.params;

    const sessionUser = getSessionUser(req);
    const role = String(sessionUser?.role || '').toLowerCase();
    const numericId = parseInt(id);

    if (role === 'teacher') {
      const teacher = await resolveTeacherForSessionUser(sessionUser);
      if (!teacher) {
        return res.status(404).json({ error: 'result_not_found' });
      }

      const yearId = req.query.school_year_id
        ? parseInt(req.query.school_year_id)
        : await resolveActiveSchoolYearId();

      const rosterWhere = { teacher_id: Number(teacher.id) };
      if (yearId) rosterWhere.school_year_id = Number(yearId);

      const rosters = await prisma.roster.findMany({
        where: rosterWhere,
        select: { class_id: true, subject_id: true },
      });

      if (!rosters.length) {
        return res.status(404).json({ error: 'result_not_found' });
      }

      const result = await prisma.result.findFirst({
        where: {
          id: numericId,
          OR: rosters.map((r) => ({
            student: { class_id: r.class_id },
            assessment: {
              ...(yearId ? { school_year_id: Number(yearId) } : {}),
              class_id: r.class_id,
              subject: { subject_id: r.subject_id },
            },
          })),
        },
        include: {
          student: true,
          assessment: {
            include: {
              class_layout: true,
              subject: {
                include: {
                  subject: true,
                  course_module: true,
                },
              },
            },
          },
        },
      });

      if (!result) {
        return res.status(404).json({ error: 'result_not_found' });
      }

      return res.json(result);
    }

    const result = await prisma.result.findUnique({
      where: { id: numericId },
      include: {
        student: true,
        assessment: {
          include: {
            class_layout: true,
            subject: {
              include: {
                subject: true,
                course_module: true,
              },
            },
          },
        },
      },
    });

    if (!result) {
      return res.status(404).json({ error: 'result_not_found' });
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'failed_to_fetch_result' });
  }
};

// UPDATE result
exports.update_result = async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, date } = req.body;

    const result = await prisma.result.update({
      where: { id: parseInt(id) },
      data: {
        grade,
        date: date ? new Date(date) : undefined,
      },
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'failed_to_update_result' });
  }
};

// DELETE result
exports.delete_result = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.result.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'result_deleted_successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'failed_to_delete_result' });
  }
};
