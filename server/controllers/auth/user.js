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
	const {
		student_id
	} = req.params;
	const {
		enrollment_status
	} = req.body;
	try {
		const student = await prisma.student.update({
			where: {
				id: parseInt(student_id)
			},
			data: {
				enrollment_status
			},
		});

		res.status(200).json({
			message: 'Enrollment status updated successfully',
			student,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			message: 'Internal Server Error',
		});
	}
};