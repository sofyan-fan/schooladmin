exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        message: 'Could not log out, please try again.',
      });
    }
    // Clears the session cookie
    res.clearCookie('connect.sid'); // The default session cookie name
    res.status(200).json({ message: 'Logout successful' });
  });
};
