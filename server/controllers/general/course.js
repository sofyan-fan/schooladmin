const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.get_all_courses = async (req, res) => {
  try {
    const courses = await prisma.courses.findMany({
      include: {
        subjects: true,
        tuition_payments: true,
      },
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({
      error: 'Error fetching courses',
    });
  }
};

exports.create_course = async (req, res) => {
  const { name, description, price, subjectIds } = req.body;

  try {
    const course = await prisma.courses.create({
      data: {
        name,
        description,
        price,
        subjects: {
          connect: subjectIds.map((id) => ({
            id,
          })),
        },
      },
    });
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({
      error: 'Error creating course',
    });
  }
};

exports.get_all_modules = async (req, res) => {
  try {
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
    res.status(500).json({
      error: 'Error fetching course modules',
    });
  }
};

exports.create_module = async (req, res) => {
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
    });
    res.status(201).json(courseModule);
  } catch (error) {
    res.status(500).json({
      error: 'Error creating course module',
    });
  }
};

exports.update_module = async (req, res) => {
  const { id } = req.params;
  const { name, subjects } = req.body;

  try {
    const updatedModule = await prisma.$transaction(async (prisma) => {
      await prisma.course_module_subject.deleteMany({
        where: {
          course_module_id: Number(id),
        },
      });

      const module = await prisma.course_module.update({
        where: {
          id: Number(id),
        },
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
      });

      return module;
    });

    res.json(updatedModule);
  } catch (error) {
    res.status(500).json({
      error: 'Error updating course module',
    });
  }
};

exports.delete_module = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.$transaction(async (prisma) => {
      await prisma.course_module_subject.deleteMany({
        where: {
          course_module_id: Number(id),
        },
      });

      await prisma.course_module.delete({
        where: {
          id: Number(id),
        },
      });
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      error: 'Error deleting course module',
    });
  }
};
