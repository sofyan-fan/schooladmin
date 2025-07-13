exports.getMe = (req, res) => {
  // The `authenticate` middleware has already run and attached `req.user`
  // and verified the session. If we reach this point, the user is authenticated.
  res.status(200).json({
    message: 'User is authenticated.',
    user: req.user, // Send back the user data from the session
  });
};
