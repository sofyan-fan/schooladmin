const {
	prisma
} = require('../../prisma/connection');
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
	const {
		email,
		password
	} = req.body;

	try {
		const user = await prisma.user.findUnique({
			where: {
				email: email,
			},
		});

		if (!user) {
			return res.status(401).json({
				message: 'Invalid credentials',
			});
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			return res.status(401).json({
				message: 'Invalid credentials',
			});
		}

		// Set user information in the session
		req.session.user = {
			id: user.id,
			email: user.email,
			firstname: user.firstname,
			lastname: user.lastname,
		};

		// Respond with user data
		console.log("req.session.user: ", req.session.user);

		res.status(200).json({
			message: 'Login successful',
			user: req.session.user,
			session: req.session,
		});

	} catch (error) {
		console.error(error);
		res.status(500).json({
			message: 'Internal Server Error',
		});
	}
};

exports.logout = (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			return res.status(500).json({
				message: 'Could not log out, please try again.',
			});
		}

		res.status(200).json({
			message: 'Logout successful',
		});
	});
};