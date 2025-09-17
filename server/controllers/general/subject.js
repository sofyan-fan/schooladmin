const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.get_all_subjects = async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        levels: true,
        materials: true,
      },
    });
    res.json(subjects);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error fetching subjects',
    });
  }
};

exports.get_subject_by_id = async (req, res) => {
  const { id } = req.params;
  const idNum = Number(id);

  if (isNaN(idNum))
    return res.status(400).json({
      error: 'Invalid subject ID',
    });

  try {
    const subject = await prisma.subject.findUnique({
      where: {
        id: idNum,
      },
      include: {
        levels: true,
        materials: true,
      },
    });

    if (!subject)
      return res.status(404).json({
        error: 'Subject not found',
      });

    res.json(subject);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error fetching subject',
    });
  }
};

exports.create_subject = async (req, res) => {
  const { name, levels = [], materials = [] } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({
      error: 'Subject name is required',
    });
  }

  try {
    const subject = await prisma.subject.create({
      data: {
        name,
        levels: {
          create: levels.map((level) => ({
            level,
          })),
        },
        materials: {
          create: materials.map((material) => ({
            material,
          })),
        },
      },
      include: {
        levels: true,
        materials: true,
      },
    });

    res.status(201).json(subject);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error creating subject',
    });
  }
};

exports.update_subject = async (req, res) => {
  const { id } = req.params;
  const { name, levels = [], materials = [] } = req.body;
  const idNum = Number(id);

  if (isNaN(idNum))
    return res.status(400).json({
      error: 'Invalid subject ID',
    });

  try {
    const subject = await prisma.subject.update({
      where: {
        id: idNum,
      },
      data: {
        name,
        // Replace all levels and materials (optional approach)
        levels: {
          deleteMany: {}, // clear old ones
          create: levels.map((level) => ({
            level,
          })),
        },
        materials: {
          deleteMany: {}, // clear old ones
          create: materials.map((material) => ({
            material,
          })),
        },
      },
      include: {
        levels: true,
        materials: true,
      },
    });

    res.json(subject);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error updating subject',
    });
  }
};

exports.delete_subject = async (req, res) => {
  const { id } = req.params;
  const idNum = Number(id);

  if (isNaN(idNum))
    return res.status(400).json({
      error: 'Invalid subject ID',
    });

  try {
    // Collect course_module_subject ids for this subject
    const cms = await prisma.course_module_subject.findMany({
      where: { subject_id: idNum },
      select: { id: true },
    });
    const moduleSubjectIds = cms.map((r) => r.id);

    // Delete dependent results -> assessments that reference these course_module_subject ids
    if (moduleSubjectIds.length > 0) {
      const assessments = await prisma.assessment.findMany({
        where: { subject_id: { in: moduleSubjectIds } },
        select: { id: true },
      });
      const assessmentIds = assessments.map((a) => a.id);
      if (assessmentIds.length > 0) {
        await prisma.result.deleteMany({
          where: { assessment_id: { in: assessmentIds } },
        });
        await prisma.assessment.deleteMany({
          where: { id: { in: assessmentIds } },
        });
      }

      // Now safe to delete module-subject relations for this subject
      await prisma.course_module_subject.deleteMany({
        where: { id: { in: moduleSubjectIds } },
      });
    }

    // Delete rosters referencing this subject (and their absences)
    const rosters = await prisma.roster.findMany({
      where: { subject_id: idNum },
      select: { id: true },
    });
    const rosterIds = rosters.map((r) => r.id);
    if (rosterIds.length > 0) {
      await prisma.absence.deleteMany({
        where: { roster_id: { in: rosterIds } },
      });
      await prisma.roster.deleteMany({
        where: { id: { in: rosterIds } },
      });
    }

    // Then, delete the subject's levels and materials
    await prisma.subject_level.deleteMany({
      where: {
        subject_id: idNum,
      },
    });
    await prisma.subject_material.deleteMany({
      where: {
        subject_id: idNum,
      },
    });

    // Finally, delete the subject itself
    await prisma.subject.delete({
      where: {
        id: idNum,
      },
    });

    res.json({
      message: 'Subject and related data deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error deleting subject',
    });
  }
};
