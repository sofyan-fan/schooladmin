const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.create_subject = async (req, res) => {
  try {
    const { name, level } = req.body;

    const subject = await prisma.subject.create({
      data: {
        name,
        level,
      },
    });

    res.status(201).json(subject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create subject' });
  }
};

exports.get_subjects = async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany();
    res.status(200).json(subjects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
};

exports.get_subject_by_id = async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(id) },
    });

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    res.status(200).json(subject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch subject' });
  }
};

exports.update_subject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, level } = req.body;

    const subject = await prisma.subject.update({
      where: { id: parseInt(id) },
      data: {
        name,
        level,
      },
    });

    res.status(200).json(subject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update subject' });
  }
};
// DELETE SUBJECT
exports.delete_subject = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.subject.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
};
