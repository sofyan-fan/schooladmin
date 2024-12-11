const { prisma } = require("../../prisma/connection");
const bcrypt = require('bcrypt');

exports.get_login = async (req, res) => {
    res.render('auth/login');
}

exports.login = async (req, res) => {
    
    let {
        email,
        password
    } = req.body

    console.log('Login credentials ' + email, password);
    

    try {

        /* check if password and email are in database > let them in | else give a message saying something went wrong */
        const user = await prisma.users.findUnique({

            where: {
                email: email
            },
                select: {
                    id: true,
                    email: true,
                    password: true,
                    firstname: true,
                    lastname: true,
                    phone: true,
                    gender: true,
                },
        });

    console.log('Logged in user: ' + user);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' }); // Send 500 status in case of server error
        return; // Terminate the function after sending the response
    }

    res.redirect('/dashboard');
}