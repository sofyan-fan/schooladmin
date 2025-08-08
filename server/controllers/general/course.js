const {
	PrismaClient
} = require('@prisma/client');
const prisma = new PrismaClient();

// Get all courses with modules
exports.get_all_courses = async (req, res) => {
	try {
		const courses = await prisma.courses.findMany({
			include: {
				course_module: {
					include: {
						subject: true,
						book: true,
					},
				},
				tuition_payments: true,
			},
		});
		res.status(200).json(courses);
	} catch (error) {
		console.error(error);
		res.status(500).json({
			error: 'Something went wrong.'
		});
	}
};

// Get a single course by ID
exports.get_course_by_id = async (req, res) => {
	try {
		const {
			id
		} = req.params;
		const course = await prisma.courses.findUnique({
			where: {
				id: parseInt(id)
			},
			include: {
				course_module: {
					include: {
						subject: true,
						book: true,
					},
				},
				tuition_payments: true,
			},
		});

		if (!course) {
			return res.status(404).json({
				error: 'Course not found.'
			});
		}

		res.status(200).json(course);
	} catch (error) {
		console.error(error);
		res.status(500).json({
			error: 'Something went wrong.'
		});
	}
};

// Create a new course with modules
exports.create_course = async (req, res) => {
	try {
		const {
			name,
			description,
			price,
			modules
		} = req.body;

		const course = await prisma.courses.create({
			data: {
				name,
				description,
				price,
				course_module: {
					create: modules.map(module => ({
						subjectId: module.subjectId,
						bookId: module.bookId,
					})),
				},
			},
			include: {
				course_module: true,
			},
		});

		res.status(201).json(course);
	} catch (error) {
		console.error(error);
		res.status(500).json({
			error: 'Something went wrong.'
		});
	}
};

// Update a course and its modules
exports.update_course = async (req, res) => {
	try {
		const {
			id
		} = req.params;
		const {
			name,
			description,
			price,
			modules
		} = req.body;

		const updatedCourse = await prisma.courses.update({
			where: {
				id: parseInt(id)
			},
			data: {
				name,
				description,
				price,
				course_module: {
					deleteMany: {},
					create: modules.map(module => ({
						subjectId: module.subjectId,
						bookId: module.bookId,
					})),
				},
			},
			include: {
				course_module: true,
			},
		});

		res.status(200).json(updatedCourse);
	} catch (error) {
		console.error(error);
		1
		res.status(500).json({
			error: 'Something went wrong.'
		});
	}
};

// Delete a course
exports.delete_course = async (req, res) => {
	try {
		const {
			id
		} = req.params;

		await prisma.courses.delete({
			where: {
				id: parseInt(id)
			},
		});

		res.status(200).json({
			message: 'Course deleted successfully.'
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			error: 'Something went wrong.'
		});
	}
};