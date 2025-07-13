const { prisma } = require('../prisma/connection');

exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.users.findMany();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getMe = async (req, res) => {
  // The user object is attached to the request by the authenticate middleware
  res.status(200).json(req.user);
};
