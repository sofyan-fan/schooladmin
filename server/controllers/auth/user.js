const { prisma } = require('../../prisma/connection');

exports.get_users = async (req, res) => {
	try {
		const users = await prisma.user.findMany();
		res.status(200).json(users);
	} catch (error) {
		console.error(error);
		res.status(500).json({
			message: 'Internal Server Error'
		});
	}
};

exports.get_user = async (req, res) => {
	res.status(200).json(req.user);
};

exports.update_enrollment = async (req, res) => {
  const { student_id } = req.params;
  const { enrollment_status } = req.body;

  try {
    // Update the student's enrollment status
    const student = await prisma.student.update({
      where: { id: parseInt(student_id) },
      data: { enrollment_status },
      include: {
        payments: true,           // optional, if you want to check previous payments
        class_layout: {           // include the class layout and course
          include: {
            course: true
          }
        }
      }
    });

    // If enrollment is being activated, create a financial log
    if (enrollment_status) {
      const course = student.class_layout?.course;

      if (!course) {
        return res.status(400).json({
          message: 'Student is not assigned to a course, cannot log payment'
        });
      }

      await prisma.financial_log.create({
        data: {
          type_id: 1, // replace with your "Enrollment Fee" financial type ID
          student_id: student.id,
          course_id: course.id,
          amount: course.price,          // use the course price
          method: 'system',             // default or specify payment method
          notes: 'Enrollment fee charged',
          transaction_type: 'income',   // enrollment is income
        },
      });
    }

    res.status(200).json({
      message: 'Enrollment status updated successfully',
      student,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message
    });
  }
};
