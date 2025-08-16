const { prisma } = require('../../prisma/connection');

exports.create_roster = async (req, res) => {
	try {
		const {
			class_id,
			subject_id,
			teacher_id,
			days
		} = req.body;

		const data = days.map(day => ({
			class_id,
			subject_id,
			teacher_id,
			day_of_week: day.day_of_week,
			start_time: day.start_time,
			end_time: day.end_time,
			classroom_id: day.classroom_id,
		}));

		const newRoster = await prisma.roster.createMany({
			data
		});

		res.status(201).json({
			message: 'Roster created',
			newRoster,
		});
	} catch (error) {
		console.error('Error creating roster:', error);
		res.status(500).json({
			error: 'Failed to create roster'
		});
	}
};

exports.get_roster = async (req, res) => {
	try {
		const rosters = await prisma.roster.findMany({
			include: {
				class_layout: true,
				subject: true,
				teacher: true,
				classroom: true,
			},
			orderBy: {
				day_of_week: 'asc'
			},
		});

		res.status(200).json(rosters);
	} catch (error) {
		console.error('Error fetching rosters:', error);
		res.status(500).json({
			error: 'Failed to fetch rosters'
		});
	}
};

exports.update_roster = async (req, res) => {
	try {
		const {
			id
		} = req.params;
		const {
			day_of_week,
			start_time,
			end_time,
			subject_id,
			class_id,
			teacher_id,
			classroom_id,
		} = req.body;

		const updatedRoster = await prisma.roster.update({
			where: {
				id: parseInt(id)
			},
			data: {
				day_of_week,
				start_time,
				end_time,
				subject_id,
				class_id,
				teacher_id,
				classroom_id,
			},
			include: {
				class_layout: true,
				subject: true,
				teacher: true,
				classroom: true,
			},
		});

		res.status(200).json({
			message: 'Roster updated',
			updatedRoster,
		});
	} catch (error) {
		console.error('Error updating roster:', error);
		res.status(500).json({
			error: 'Failed to update roster'
		});
	}
};