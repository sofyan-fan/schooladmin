const { prisma } = require('../../prisma/connection');

exports.get_users = async (req, res) => {
	try {
		const users = await prisma.users.findMany();
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