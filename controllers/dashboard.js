const { prisma } = require("../prisma/connection");

exports.get_dashboard = async (req, res) => {
    try {

        // get events
        const events = await prisma.event.findMany({
            select: {
                id: true,
                event_name: true,
                event_date: true,
            }
        });

        req.session.events = events;
        

        res.render('dashboard/dashboard', { req: req });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({
            error: 'An error occurred while creating the event'
        });
    }
};