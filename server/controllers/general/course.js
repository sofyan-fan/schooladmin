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
  const {
    name,
    description,
    price,
    subject_ids,
    modules,
  } = req.body;

  try {
    const course = await prisma.courses.create({
      data: {
        name,
        description,
        price,
        subjects: {
          connect: subject_ids.map(id => ({ id })),
        },
        course_module: modules ? {
          create: modules.map(mod => ({
            name: mod.name,
            subjects: {
              create: mod.subjects.map(sub => ({
                subject_id: sub.subject_id,
                level: sub.level,
                material: sub.material,
              })),
            },
          })),
        } : undefined,
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
  const {
    id,
    name,
    description,
    price,
    subject_ids,
    modules,
  } = req.body;

  try {
    const existingCourse = await prisma.courses.findUnique({
      where: { id },
      include: { course_module: true },
    });

    if (!existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Disconnect all current subjects
    await prisma.courses.update({
      where: { id },
      data: {
        subjects: {
          set: [], // disconnect all subjects
        },
      },
    });

    // Delete all course modules (and cascade their subjects)
    await prisma.course_module.deleteMany({
      where: { course_id: id },
    });

    // Update the course with new values
    const updatedCourse = await prisma.courses.update({
      where: { id },
      data: {
        name,
        description,
        price,
        subjects: {
          connect: subject_ids.map(id => ({ id })), // connect new subjects
        },
        course_module: modules ? {
          create: modules.map(mod => ({
            name: mod.name,
            subjects: {
              create: mod.subjects.map(sub => ({
                subject_id: sub.subject_id,
                level: sub.level,
                material: sub.material,
              })),
            },
          })),
        } : undefined,
      },
      include: {
        subjects: {
          include: {
            levels: true,
            materials: true,
          },
        },
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
      where: { id },
      include: { course_module: true },
    });

    if (!existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Delete course modules (and cascade their subjects)
    await prisma.course_module.deleteMany({
      where: { course_id: id },
    });

    // Delete course
    await prisma.courses.delete({
      where: { id },
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
  const {
    name,
    course_id,
    subjects,
  } = req.body;

  try {
    const courseModule = await prisma.course_module.create({
      data: {
        name,
        course_id,
        subjects: {
          create: subjects.map(sub => ({
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
  const { id, name, subjects } = req.body;

  try {
    const existingModule = await prisma.course_module.findUnique({
      where: { id },
      include: { subjects: true },
    });

    if (!existingModule) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Disconnect all current subjects
    await prisma.course_module.update({
      where: { id },
      data: {
        subjects: {
          set: [], // disconnect all subjects
        },
      },
    });

    // Update the module with new name and subjects
    const updatedModule = await prisma.course_module.update({
      where: { id },
      data: {
        name,
        subjects: {
          create: subjects.map(sub => ({
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
      where: { id },
      include: { subjects: true },
    });

    if (!existingModule) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Delete the module's subjects
    await prisma.course_module_subject.deleteMany({
      where: { course_module_id: id },
    });

    // Delete the course module
    await prisma.course_module.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Course module deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting course module' });
  }
};
