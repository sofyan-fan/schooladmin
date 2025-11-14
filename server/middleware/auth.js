// Middleware to check if user is authenticated and is an admin
exports.requireAdmin = (req, res, next) => {
  const sessionUser = req.session?.user;
  
  if (!sessionUser) {
    return res.status(401).json({
      message: 'Not authenticated',
    });
  }

  if ((sessionUser.role || '').toLowerCase() !== 'admin') {
    return res.status(403).json({
      message: 'Forbidden: Admin access required',
    });
  }

  next();
};

