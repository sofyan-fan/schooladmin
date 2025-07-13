const { prisma } = require('../../prisma/connection');
const bcrypt = require('bcrypt');

const JWT_SECRET = 'your-super-secret-key-that-is-long-and-secure'; // In production, use an environment variable

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.users.findUnique({
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
    res.status(200).json({
      message: 'Login successful',
      user: req.session.user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
};
