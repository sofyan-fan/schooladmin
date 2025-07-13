const { prisma } = require('../prisma/connection');

exports.get_dashboard_data = async (req, res) => {
  try {
    const totalStudents = await prisma.users.count({
      where: {
        role: 'student',
      },
    });

    const totalTeachers = await prisma.users.count({
      where: {
        role: 'teacher',
      },
    });

    res.status(200).json({
      totalStudents,
      totalTeachers,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      error: 'An error occurred while fetching dashboard data',
    });
  }
};
