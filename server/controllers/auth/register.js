const { prisma } = require('../../prisma/connection');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
	try {
		const {
			email,
			password,
			role
		} = req.body;

		if (!email || !password || !role) {
			return res.status(400).json({
				message: 'All fields are required.'
			});
		}

		const existingUser = await prisma.user.findUnique({
			where: {
				email
			},
		});
		if (existingUser) {
			return res.status(400).json({
				message: 'User already exists.'
			});
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const user = await prisma.user.create({
			data: {
				email,
				password: hashedPassword,
				role,
			},
		});

		return res.status(201).json({
			message: 'User registered successfully.',
			user: {
				id: user.id,
				email: user.email
			}
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({
			message: 'Server error.'
		});
	}
};
