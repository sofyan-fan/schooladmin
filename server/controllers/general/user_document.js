const { prisma } = require('../../prisma/connection');

exports.get_all_students = async (req, res) => {
	try {
		const students = await prisma.users.findMany({
			where: {
				role: 'student',
			},
		});
		res.status(200).json(students);
	} catch (error) {
		console.error('Error fetching students:', error);
		res.status(500).json({
			error: 'An error occurred while fetching students',
		});
	}
};

exports.get_student_by_id = async (req, res) => {
	try {
		const student = await prisma.users.findUnique({
			where: {
				id: Number(req.params.id),
				role: 'student',
			},
		});
		if (!student) {
			return res.status(404).json({
				message: 'Student not found',
			});
		}
		res.status(200).json(student);
	} catch (error) {
		console.error('Error fetching student:', error);
		res.status(500).json({
			error: 'An error occurred while fetching the student',
		});
	}
};

exports.search_students = async (req, res) => {
	try {
		const {
			query
		} = req.query;
		const students = await prisma.users.findMany({
			where: {
				role: 'student',
				OR: [{
						firstname: {
							contains: query,
							mode: 'insensitive',
						},
					},
					{
						lastname: {
							contains: query,
							mode: 'insensitive',
						},
					},
				],
			},
		});
		res.status(200).json(students);
	} catch (error) {
		console.error('Error searching students:', error);
		res.status(500).json({
			error: 'An error occurred while searching for students',
		});
	}
};