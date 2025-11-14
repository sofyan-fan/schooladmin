const { prisma } = require('../../prisma/connection');

exports.get_all_school_years = async (req, res) => {
	try {
		const { includeArchived, active } = req.query;
		const where = {};
		if (active === 'true') {
			where.is_active = true;
		} else if (includeArchived !== 'true') {
			where.is_archived = false;
		}
		const years = await prisma.school_year.findMany({
			where,
			orderBy: [{ start_date: 'desc' }, { id: 'desc' }],
		});
		res.status(200).json(years);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Error retrieving school years' });
	}
};

exports.get_school_year_by_id = async (req, res) => {
	try {
		const id = parseInt(req.params.id);
		const year = await prisma.school_year.findUnique({
			where: { id },
		});
		if (!year) {
			return res.status(404).json({ error: 'School year not found' });
		}
		res.status(200).json(year);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Error retrieving school year' });
	}
};

exports.get_active_school_year = async (req, res) => {
	try {
		const activeYear = await prisma.school_year.findFirst({
			where: { is_active: true },
		});
		if (!activeYear) {
			return res.status(404).json({ error: 'No active school year' });
		}
		res.status(200).json(activeYear);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Error retrieving active school year' });
	}
};

exports.create_school_year = async (req, res) => {
	try {
		const { name, start_date, end_date } = req.body;
		if (!name || !start_date || !end_date) {
			return res.status(400).json({ error: 'name, start_date and end_date are required' });
		}
		const start = new Date(start_date);
		const end = new Date(end_date);
		if (isNaN(start.getTime()) || isNaN(end.getTime())) {
			return res.status(400).json({ error: 'Invalid start_date or end_date' });
		}
		if (start >= end) {
			return res.status(400).json({ error: 'start_date must be before end_date' });
		}
		const created = await prisma.school_year.create({
			data: {
				name,
				start_date: start,
				end_date: end,
				is_archived: false,
				is_active: false,
			},
		});
		res.status(201).json({ message: 'School year created', school_year: created });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Error creating school year' });
	}
};

exports.update_school_year = async (req, res) => {
	try {
		const id = parseInt(req.params.id);
		const { name, start_date, end_date } = req.body;
		const data = {};
		if (name !== undefined) data.name = name;
		if (start_date !== undefined) {
			const d = new Date(start_date);
			if (isNaN(d.getTime())) {
				return res.status(400).json({ error: 'Invalid start_date' });
			}
			data.start_date = d;
		}
		if (end_date !== undefined) {
			const d = new Date(end_date);
			if (isNaN(d.getTime())) {
				return res.status(400).json({ error: 'Invalid end_date' });
			}
			data.end_date = d;
		}
		if (data.start_date && data.end_date && data.start_date >= data.end_date) {
			return res.status(400).json({ error: 'start_date must be before end_date' });
		}
		const updated = await prisma.school_year.update({
			where: { id },
			data,
		});
		res.status(200).json({ message: 'School year updated', school_year: updated });
	} catch (error) {
		console.error(error);
		if (error.code === 'P2025') {
			return res.status(404).json({ error: 'School year not found' });
		}
		res.status(500).json({ error: 'Error updating school year' });
	}
};

exports.activate_school_year = async (req, res) => {
	try {
		const id = parseInt(req.params.id);
		const exists = await prisma.school_year.findUnique({ where: { id } });
		if (!exists) {
			return res.status(404).json({ error: 'School year not found' });
		}
		await prisma.$transaction([
			prisma.school_year.updateMany({ data: { is_active: false }, where: { is_active: true } }),
			prisma.school_year.update({
				where: { id },
				data: { is_active: true, is_archived: false },
			}),
		]);
		const active = await prisma.school_year.findUnique({ where: { id } });
		res.status(200).json({ message: 'School year activated', school_year: active });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Error activating school year' });
	}
};

exports.archive_school_year = async (req, res) => {
	try {
		const id = parseInt(req.params.id);
		const updated = await prisma.school_year.update({
			where: { id },
			data: { is_archived: true, is_active: false },
		});
		res.status(200).json({ message: 'School year archived', school_year: updated });
	} catch (error) {
		console.error(error);
		if (error.code === 'P2025') {
			return res.status(404).json({ error: 'School year not found' });
		}
		res.status(500).json({ error: 'Error archiving school year' });
	}
};

