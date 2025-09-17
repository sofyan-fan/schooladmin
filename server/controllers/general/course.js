const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.get_all_courses = async (req, res) => {
  try {
    const courses = await prisma.courses.findMany({
      include: {
        subjects: {
          include: {
            levels: true,
            materials: true,
          },
        },
        course_modules: {
          include: {
            module: {
              include: {
                subjects: {
                  include: {
                    subject: {
                      include: {
                        levels: true,
                        materials: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Transform the data to match the expected format
    const transformedCourses = courses.map((course) => ({
      ...course,
      course_module: course.course_modules.map((relation) => relation.module),
    }));

    res.json({ courses: transformedCourses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching courses with full details' });
  }
};

exports.create_course = async (req, res) => {
  const { name, description, price, module_ids } = req.body;

  try {
    const course = await prisma.courses.create({
      data: {
        name,
        description,
        price,
        course_modules:
          module_ids && module_ids.length > 0
            ? {
                create: module_ids.map((moduleId) => ({
                  module_id: Number(moduleId),
                })),
              }
            : undefined,
      },
      include: {
        course_modules: {
          include: {
            module: {
              include: {
                subjects: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Transform to match expected format
    const transformedCourse = {
      ...course,
      course_module: course.course_modules.map((relation) => relation.module),
    };

    res.status(201).json(transformedCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating course' });
  }
};

exports.update_course = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, module_ids } = req.body;

  try {
    const existingCourse = await prisma.courses.findUnique({
      where: { id: Number(id) },
      include: { course_modules: true },
    });

    if (!existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Delete existing course-module relationships for this course
    await prisma.course_module_relation.deleteMany({
      where: { course_id: Number(id) },
    });

    // Update the course and create new module relationships
    const updatedCourse = await prisma.courses.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        price,
        course_modules:
          module_ids && module_ids.length > 0
            ? {
                create: module_ids.map((moduleId) => ({
                  module_id: Number(moduleId),
                })),
              }
            : undefined,
      },
      include: {
        course_modules: {
          include: {
            module: {
              include: {
                subjects: {
                  include: {
                    subject: {
                      include: {
                        levels: true,
                        materials: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Transform to match expected format
    const transformedCourse = {
      ...updatedCourse,
      course_module: updatedCourse.course_modules.map(
        (relation) => relation.module
      ),
    };

    res.json(transformedCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating course' });
  }
};

exports.delete_course = async (req, res) => {
  const { id } = req.params;

  try {
    const courseId = Number(id);

    // Detach any classes pointing to this course to avoid FK errors
    await prisma.class_layout.updateMany({
      where: { course_id: courseId },
      data: { course_id: null },
    });

    // With a many-to-many relationship, we only need to delete the relations,
    // not the modules themselves. This allows modules to be reused.
    await prisma.course_module_relation.deleteMany({
      where: { course_id: courseId },
    });

    // Optional: delete tuition payments for this course (uncomment if desired)
    // await prisma.tuition_payment.deleteMany({ where: { course_id: courseId } });

    // Then, delete the course itself
    await prisma.courses.delete({
      where: { id: courseId },
    });

    res.status(200).json({
      message: 'Course and its module relations deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting course' });
  }
};

exports.get_all_modules = async (req, res) => {
  try {
    // The direct `course` relation no longer exists.
    // The client doesn't need course info on this page, so we remove the include.
    const modules = await prisma.course_module.findMany({
      include: {
        subjects: {
          include: {
            subject: true,
          },
        },
      },
    });
    res.json(modules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching course modules' });
  }
};

exports.create_module = async (req, res) => {
  // course_id is no longer part of a module, it's a standalone entity.
  const { name, subjects } = req.body;

  try {
    const courseModule = await prisma.course_module.create({
      data: {
        name,
        subjects: {
          create: subjects.map((sub) => ({
            subject_id: sub.subject_id,
            level: sub.level,
            material: sub.material,
          })),
        },
      },
      include: {
        subjects: {
          include: {
            subject: true,
          },
        },
      },
    });
    res.status(201).json(courseModule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating course module' });
  }
};

exports.update_module = async (req, res) => {
  const { id } = req.params;
  const { name, subjects } = req.body;

  try {
    const existingModule = await prisma.course_module.findUnique({
      where: { id: Number(id) },
      include: { subjects: true },
    });

    if (!existingModule) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Delete all current subjects first (to avoid foreign key constraint)
    await prisma.course_module_subject.deleteMany({
      where: { course_module_id: Number(id) },
    });

    // Update the module with new name and subjects
    const updatedModule = await prisma.course_module.update({
      where: { id: Number(id) },
      data: {
        name,
        subjects: {
          create: subjects.map((sub) => ({
            subject_id: sub.subject_id,
            level: sub.level,
            material: sub.material,
          })),
        },
      },
      include: {
        subjects: {
          include: {
            subject: true,
          },
        },
      },
    });

    res.json(updatedModule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating course module' });
  }
};

exports.delete_module = async (req, res) => {
  const { id } = req.params;

  try {
    const existingModule = await prisma.course_module.findUnique({
      where: { id: Number(id) },
    });

    if (!existingModule) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const moduleId = Number(id);

    // Gather subject relation IDs for this module
    const cms = await prisma.course_module_subject.findMany({
      where: { course_module_id: moduleId },
      select: { id: true, subject_id: true },
    });
    const moduleSubjectIds = cms.map((r) => r.id);

    // Assessments referencing this module's subjects and class combos are modeled via course_module_subject -> subject
    // First delete dependent results, then assessments
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

    // Delete course relations to this module
    await prisma.course_module_relation.deleteMany({
      where: { module_id: moduleId },
    });

    // Delete module-subject links
    if (moduleSubjectIds.length > 0) {
      await prisma.course_module_subject.deleteMany({
        where: { id: { in: moduleSubjectIds } },
      });
    }

    // Finally, delete the course module itself
    await prisma.course_module.delete({
      where: { id: moduleId },
    });

    res.status(200).json({ message: 'Course module deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting course module' });
  }
};
