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

// Create a new assessment
exports.create_assessment = async (req, res) => {
  try {
    const {
      type,
      name,
      class_id,
      subject_id,
      leverage,
      date,
      is_central,
      description,
      school_year_id,
    } = req.body;

    let resolvedSchoolYearId = school_year_id ? parseInt(school_year_id) : null;
    if (!resolvedSchoolYearId && prisma.school_year && typeof prisma.school_year.findFirst === 'function') {
      const activeYear = await prisma.school_year.findFirst({ where: { is_active: true } });
      if (!activeYear) {
        return res.status(400).json({ success: false, message: 'No active school year. Provide school_year_id' });
      }
      resolvedSchoolYearId = activeYear.id;
    }

    const newAssessment = await prisma.assessment.create({
      data: {
        type,
        name,
        class_id,
        subject_id,
        leverage: leverage || 1,
        date: new Date(date),
        is_central,
        description,
        ...(prisma.school_year && typeof prisma.school_year.findFirst === 'function'
          ? { school_year_id: resolvedSchoolYearId }
          : {}),
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: newAssessment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message,
    });
  }
};

// Get all assessments
exports.get_all_assessments = async (req, res) => {
  try {
    const where = {};
    if (req.query.school_year_id) {
      where.school_year_id = parseInt(req.query.school_year_id);
    } else if (prisma.school_year && typeof prisma.school_year.findFirst === 'function') {
      const activeYear = await prisma.school_year.findFirst({ where: { is_active: true } });
      if (activeYear) where.school_year_id = activeYear.id;
    }

    const sessionUser = getSessionUser(req);
    const role = String(sessionUser?.role || '').toLowerCase();
    if (role === 'teacher') {
      const teacher = await resolveTeacherForSessionUser(sessionUser);
      if (!teacher) {
        return res.status(200).json({ success: true, data: [] });
      }

      const rosterWhere = { teacher_id: Number(teacher.id) };
      if (where.school_year_id) {
        rosterWhere.school_year_id = Number(where.school_year_id);
      }

      const rosters = await prisma.roster.findMany({
        where: rosterWhere,
        select: { class_id: true, subject_id: true },
      });

      if (!rosters.length) {
        return res.status(200).json({ success: true, data: [] });
      }

      const scope = {
        OR: rosters.map((r) => ({
          class_id: r.class_id,
          subject: { subject_id: r.subject_id },
        })),
      };

      // Combine existing where (school year) with teacher scope without allowing cross-mixing
      where.AND = [...(where.AND || []), scope];
    }

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        class_layout: true,
        subject: true,
        results: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: assessments,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message,
    });
  }
};

// Get a single assessment by ID
exports.get_assessment_by_id = async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = parseInt(id);

    const sessionUser = getSessionUser(req);
    const role = String(sessionUser?.role || '').toLowerCase();

    if (role === 'teacher') {
      const teacher = await resolveTeacherForSessionUser(sessionUser);
      if (!teacher) {
        return res.status(404).json({ success: false, message: 'Assessment not found' });
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
        return res.status(404).json({ success: false, message: 'Assessment not found' });
      }

      const assessment = await prisma.assessment.findFirst({
        where: {
          id: numericId,
          ...(yearId ? { school_year_id: Number(yearId) } : {}),
          OR: rosters.map((r) => ({
            class_id: r.class_id,
            subject: { subject_id: r.subject_id },
          })),
        },
        include: {
          class_layout: true,
          subject: true,
          results: true,
        },
      });

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: assessment,
      });
    }

    const assessment = await prisma.assessment.findUnique({
      where: {
        id: numericId,
      },
      include: {
        class_layout: true,
        subject: true,
        results: true,
      },
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message,
    });
  }
};

// Update an assessment
exports.update_assessment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type,
      name,
      class_id,
      subject_id,
      leverage,
      date,
      is_central,
      description,
    } = req.body;

    const updatedAssessment = await prisma.assessment.update({
      where: {
        id: parseInt(id),
      },
      data: {
        type,
        name,
        class_id,
        subject_id,
        leverage,
        date: date ? new Date(date) : undefined,
        is_central,
        description,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Assessment updated successfully',
      data: updatedAssessment,
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message,
    });
  }
};

// Delete an assessment
exports.delete_assessment = async (req, res) => {
  try {
    const { id } = req.params;

    // First, delete dependent results for this assessment
    await prisma.result.deleteMany({
      where: {
        assessment_id: parseInt(id),
      },
    });

    await prisma.assessment.delete({
      where: {
        id: parseInt(id),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Assessment deleted successfully',
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message,
    });
  }
};
