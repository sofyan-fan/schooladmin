const { prisma } = require("../prisma/connection");

exports.get_leerlingenbestand = async (req, res) => {
        res.render('leerlingenbeheer/leerlingenbestand', { req: req });
};

