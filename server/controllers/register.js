const { prisma } = require('../prisma/connection');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
  const { firstname, lastname, email, password, phone, adress, gender } =
    req.body;

  try {
    const existingUser = await prisma.users.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'User already exists',
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await prisma.users.create({
      data: {
        firstname,
        lastname,
        email,
        password: hashedPassword,
        phone,
        adress,
        gender,
      },
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
};
