const { prisma } = require('../../prisma/connection');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
	try {
		const {
			email,
			password,
			role,
			first_name,
			last_name,
			phone,
			address,
			birth_date // comes from frontend in 'YYYY-MM-DD' format
		} = req.body;

		if (!email || !password || !role) {
			return res.status(400).json({
				message: 'Email, password, and role are required.'
			});
		}

		if (!['student', 'teacher'].includes(role.toLowerCase())) {
			return res.status(400).json({
				message: 'Role must be either "student" or "teacher".'
			});
		}

		const existingUser = await prisma.user.findUnique({ where: { email } });

		if (existingUser) {
			return res.status(400).json({ message: 'User already exists.' });
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const user = await prisma.user.create({
			data: {
				email,
				password: hashedPassword,
				role: role.toLowerCase(),
			}
		});

		if (role.toLowerCase() === 'teacher') {
			await prisma.teacher.create({
				data: {
					first_name: first_name || '',
					last_name: last_name || '',
					email,
					phone: phone || '',
					address: address || '',
					is_active: true,
				}
			});
		} else if (role.toLowerCase() === 'student') {
			if (!birth_date) {
				return res.status(400).json({
					message: 'Birth date is required for students.'
				});
			}

			await prisma.student.create({
				data: {
					first_name: first_name || '',
					last_name: last_name || '',
					birth_date: new Date(birth_date), // safely parsed
					gender: '',
					address: address || '',
					postal_code: '',
					city: '',
					phone: phone || '',
					parent_name: '',
					parent_email: '',
					lesson_package: '',
					enrollment_status: true
				}
			});
		}

		req.session.user = {
			id: user.id,
			email: user.email,
			role: user.role
		};

		return res.status(201).json({
			accessToken: 'session',
			user: {
				id: user.id,
				email: user.email,
				role: user.role
			}
		});
	} catch (err) {
		console.error('register error:', err);
		return res.status(500).json({ message: 'Server error.' });
	}
};
