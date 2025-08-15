const { prisma } = require('../../prisma/connection');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
<<<<<<< HEAD
  try {
    const {
      email,
      password,
      role,
      first_name,
      last_name,
      phone,
      address,
      birth_date, // 'YYYY-MM-DD'
      gender,
      postal_code,
      city,
      parent_name,
      parent_email,
      lesson_package,
      payment_method,
    } = req.body;
=======
	try {
		const {
			email,
			password,
			role,
			first_name,
			last_name,
			phone,
			address,
			birth_date, // 'YYYY-MM-DD'
			gender,
			postal_code,
			city,
			parent_name,
			parent_email,
			lesson_package,
			payment_method,
			sosnumber
		} = req.body;
>>>>>>> develop

    if (!email || !password || !role) {
      return res.status(400).json({
        message: 'Email, password, and role are required.',
      });
    }

    if (!['student', 'teacher'].includes(role.toLowerCase())) {
      return res.status(400).json({
        message: 'Role must be either "student" or "teacher".',
      });
    }

<<<<<<< HEAD
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists.' });
    }
=======
		const existingUser = await prisma.user.findUnique({ where: { email } });
		if (existingUser) {
			return res.status(400).json({ message: 'User already exists.' });
		}
>>>>>>> develop

    const hashedPassword = await bcrypt.hash(password, 10);

<<<<<<< HEAD
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role.toLowerCase(),
      },
    });
=======
		const user = await prisma.user.create({
			data: {
				email,
				password: hashedPassword,
				role: role.toLowerCase()
			}
		});
>>>>>>> develop

    let profile = null;

<<<<<<< HEAD
    if (role.toLowerCase() === 'teacher') {
      profile = await prisma.teacher.create({
        data: {
          first_name: first_name || '',
          last_name: last_name || '',
          email,
          phone: phone || '',
          address: address || '',
          is_active: true,
          // user_id: user.id, // removed: no relation in schema
        },
      });
    } else if (role.toLowerCase() === 'student') {
      if (!birth_date) {
        return res.status(400).json({
          message: 'Birth date is required for students.',
        });
      }

      profile = await prisma.student.create({
        data: {
          first_name: first_name || '',
          last_name: last_name || '',
          birth_date: new Date(birth_date),
          gender: gender || '',
          address: address || '',
          postal_code: postal_code || '',
          city: city || '',
          phone: phone || '',
          parent_name: parent_name || '',
          parent_email: parent_email || '',
          lesson_package: lesson_package || '',
          payment_method: payment_method || '',
          enrollment_status: true,
          // user_id: user.id, // removed: no relation in schema
        },
      });
    }

    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      data: profile,
    };

    return res.status(201).json({
      accessToken: 'session',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        data: profile,
      },
    });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
=======
		if (role.toLowerCase() === 'teacher') {
			profile = await prisma.teacher.create({
				data: {
					first_name: first_name || '',
					last_name: last_name || '',
					email,
					phone: phone || '',
					address: address || '',
					is_active: true
				}
			});
		} else if (role.toLowerCase() === 'student') {
			if (!birth_date) {
				return res.status(400).json({
					message: 'Birth date is required for students.'
				});
			}

			profile = await prisma.student.create({
				data: {
					first_name: first_name || '',
					last_name: last_name || '',
					birth_date: new Date(birth_date),
					gender: gender || '',
					address: address || '',
					postal_code: postal_code || '',
					city: city || '',
					phone: phone || '',
					parent_name: parent_name || '',
					parent_email: parent_email || '',
					lesson_package: lesson_package || '',
					payment_method: payment_method || '',
					sosnumber: sosnumber || '',
					enrollment_status: false
				}
			});
		}

		req.session.user = {
			id: user.id,
			email: user.email,
			role: user.role,
			data: profile
		};

		return res.status(201).json({
			accessToken: 'session',
			user: {
				id: user.id,
				email: user.email,
				role: user.role,
				data: profile
			}
		});
	} catch (err) {
		console.error('register error:', err);
		return res.status(500).json({ message: 'Server error.' });
	}
};
>>>>>>> develop
