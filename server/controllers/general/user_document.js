const { prisma } = require('../../prisma/connection');

exports.get_all_teachers = async (req, res) => {
	try {
		const teachers = await prisma.teacher.findMany({
			include: {
				absences: true,
				roster: {
					include: {
						class_layout: true,
						subject: true
					}
				}
			}
		});
		res.status(200).json(teachers);
	} catch (error) {
		console.error(error);
		res.status(500).json({
			error: 'Error retrieving teachers'
		});
	}
};

exports.get_all_students = async (req, res) => {
	try {
		const students = await prisma.student.findMany({
			include: {
				class_layout: true,
				progress: true,
				absences: true,
				payments: {
					include: {
						course: true
					}
				},
				results: true
			}
		});
		res.status(500).json(students);
	} catch (error) {
		console.error(error);
		res.status(500).json({
			error: 'Error retrieving students'
		});
	}
};

exports.get_student_by_id = async (req, res) => {
	try {
		const student = await prisma.user.findUnique({
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
		const students = await prisma.user.findMany({
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