const { prisma } = require('../prisma/connection');

const authenticate = async (req, res, next) => {
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
      // This case might happen if the user was deleted while their session was still active
      req.session.destroy(); // Clean up the session
      return res.status(401).json({ message: 'User not found.' });
    }

    // Attach full user object from DB to the request for downstream use
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res
      .status(500)
      .json({ message: 'Internal Server Error during authentication.' });
  }
};

module.exports = authenticate;
