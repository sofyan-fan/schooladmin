const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.get_all_courses = async (req, res) => {
  try {
    const courses = await prisma.courses.findMany({
      include: {
        course_module: {
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
    });

    res.json({ courses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching courses with full details' });
  }
};

exports.create_course = async (req, res) => {
  const { name, description, price, modules } = req.body;

  try {
    const course = await prisma.courses.create({
      data: {
        name,
        description,
        price,
        course_module: modules
          ? {
              create: modules.map((mod) => ({
                name: mod.name,
                subjects: {
                  create: mod.subjects.map((sub) => ({
                    subject_id: sub.subject_id,
                    level: sub.level,
                    material: sub.material,
                  })),
                },
              })),
            }
          : undefined,
      },
      include: {
        course_module: {
          include: {
            subjects: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating course' });
  }
};

exports.update_course = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, modules } = req.body;

  try {
    const existingCourse = await prisma.courses.findUnique({
      where: { id: Number(id) },
    });

    if (!existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Delete all modules (and cascade their subjects)
    await prisma.course_module.deleteMany({
      where: { course_id: Number(id) },
    });

    // Update base course + recreate modules
    const updatedCourse = await prisma.courses.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        price,
        course_module: modules
          ? {
              create: modules.map((mod) => ({
                name: mod.name,
                subjects: {
                  create: mod.subjects.map((sub) => ({
                    subject_id: sub.subject_id,
                    level: sub.level,
                    material: sub.material,
                  })),
                },
              })),
            }
          : undefined,
      },
      include: {
        course_module: {
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
    });

    res.json(updatedCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating course' });
  }
};

exports.delete_course = async (req, res) => {
  const { id } = req.params;

  try {
    const existingCourse = await prisma.courses.findUnique({
      where: { id: Number(id) },
    });

    if (!existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Delete course modules (cascade)
    await prisma.course_module.deleteMany({
      where: { course_id: Number(id) },
    });

    // Delete course itself
    await prisma.courses.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting course' });
  }
};

exports.get_all_modules = async (req, res) => {
  try {
    const modules = await prisma.course_module.findMany({
      include: {
        course: {
          select: { id: true, name: true },
        },
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
  const { name, course_id, subjects } = req.body;

  try {
    const courseModule = await prisma.course_module.create({
      data: {
        name,
        course_id,
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
    });

    if (!existingModule) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Delete old subjects
    await prisma.course_module_subject.deleteMany({
      where: { course_module_id: Number(id) },
    });

    // Update module + add new subjects
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

    // Delete module subjects
    await prisma.course_module_subject.deleteMany({
      where: { course_module_id: Number(id) },
    });

    // Delete module itself
    await prisma.course_module.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: 'Course module deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting course module' });
  }
};
