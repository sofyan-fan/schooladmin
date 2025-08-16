const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.get_all_subjects = async (req, res) => {
	try {
		const subjects = await prisma.subject.findMany({
			include: {
				levels: true,
				materials: true,
			},
		});
		res.json(subjects);
		console.log('subjects:', subjects);
	} catch (error) {
		res.status(500).json({
			error: 'Error fetching subjects'
		});
	}
};

exports.get_subject_by_id = async (req, res) => {
	const { id } = req.params;
	try {
		const subject = await prisma.subject.findUnique({
			where: {
				id: parseInt(id)
			},
			include: {
				levels: true,
				materials: true,
			},
		});
		if (!subject) return res.status(404).json({
			error: 'Subject not found'
		});
		res.json(subject);
	} catch (error) {
		res.status(500).json({
			error: 'Error fetching subject'
		});
	}
};

exports.create_subject = async (req, res) => {
	const { name } = req.body;
	try {
		const subject = await prisma.subject.create({
			data: {
				name
			},
		});
		res.status(201).json(subject);
	} catch (error) {
		res.status(500).json({
			error: 'Error creating subject'
		});
	}
};

exports.update_subject = async (req, res) => {
	const { id } = req.params;
	const { name } = req.body;
	try {
		const subject = await prisma.subject.update({
			where: {
				id: parseInt(id)
			},
			data: {
				name
			},
		});
		res.json(subject);
	} catch (error) {
		res.status(500).json({
			error: 'Error updating subject'
		});
	}
};

exports.delete_subject = async (req, res) => {
	const { id } = req.params;
	try {
		await prisma.subject.delete({
			where: {
				id: parseInt(id)
			},
		});
		res.json({
			message: 'Subject deleted successfully'
		});
	} catch (error) {
		res.status(500).json({
			error: 'Error deleting subject'
		});
	}
};