const { prisma } = require("../prisma/connection");

exports.get_register = async (req, res) => {
        res.render('auth/register', { req: req });
};

