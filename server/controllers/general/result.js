const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CREATE a result
exports.create_result = async (req, res) => {
  try {
    const { student_id, assessment_id, grade, date } = req.body;

    const result = await prisma.result.create({
      data: {
        student: { connect: { id: student_id } },
        assessment: { connect: { id: assessment_id } },
        grade,
        date: new Date(date),
      },
    });

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'failed_to_create_result' });
  }
};

// READ all results
exports.get_all_results = async (req, res) => {
  try {
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

    const result = await prisma.result.findUnique({
      where: { id: parseInt(id) },
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
