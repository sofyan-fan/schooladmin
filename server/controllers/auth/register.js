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
			console.log('missing fields');
			return res.status(400).json({
				message: 'All fields are required.'
			});
		}

		const existingUser = await prisma.user.findUnique({
			where: {
				email
			}
		});

		if (existingUser) {
			console.log('user exists');
			return res.status(400).json({
				message: 'User already exists.'
			});
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const user = await prisma.user.create({
			data: {
				email,
				password: hashedPassword,
				role
			}
		});

		// Set session (this will set a cookie)
		req.session.user = {
			id: user.id,
			email: user.email,
			role: user.role
		};

		// Respond with user info and dummy accessToken for frontend compatibility
		return res.status(201).json({
			accessToken: 'session', // Your frontend expects this, but you are using sessions not JWTs
			user: {
				id: user.id,
				email: user.email,
				role: user.role
			}
		});
	} catch (err) {
		console.error('register error:', err);
		return res.status(500).json({
			message: 'Server error.'
		});
	}
};