const { prisma } = require('../../prisma/connection');

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

    const totalStudentAbsent = await prisma.absence.count({
      where: {
        student_id: {
          not: null,
        },
      },
    });

    const totalStudentNotAbsent = totalStudents - totalStudentAbsent;

    const events = await prisma.events.findMany({
      orderBy: {
        date: 'asc',
      },
    });

    res.status(200).json({
      totalStudents,
      totalTeachers,
      totalStudentAbsent,
      totalStudentNotAbsent,
      events,
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      error: 'An error occurred while fetching dashboard data',
    });
  }
};