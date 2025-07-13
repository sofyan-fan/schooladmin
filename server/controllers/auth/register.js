const { prisma } = require('../../prisma/connection');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
  const { firstname, lastname, email, password, phone, adress, gender } =
    req.body;

  // Basic validation
  if (
    !firstname ||
    !lastname ||
    !email ||
    !password ||
    !phone ||
    !adress ||
    !gender
  ) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: 'User with this email already exists' });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the new user
    const user = await prisma.users.create({
      data: {
        firstname,
        lastname,
        email,
        password: hashedPassword,
        phone,
        adress,
        gender,
        // 'role' will use the default "student" value from the schema
      },
    });

    // Create a session for the new user, logging them in automatically
    req.session.user = {
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
    };

    // We don't return the password hash
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'User created and logged in successfully.',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
