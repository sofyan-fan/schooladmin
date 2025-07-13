const { prisma } = require('../prisma/connection');

exports.authenticate = async (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res
      .status(401)
      .json({ message: 'Authentication invalid. Please log in.' });
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id: req.session.user.id },
    });

    if (!user) {
      req.session.destroy();
      return res.status(401).json({ message: 'User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Internal Server Error during authentication.' });
  }
};

module.exports = authenticate;
