const { prisma } = require("../prisma/connection");
const { format } = require('date-fns');

exports.create_event = async (req, res) => {
    try {
        // Extract event details from the request body
        let { event_name, event_date } = req.body;

        // Validate the input
        if (!event_name || !event_date) {
            return res.status(400).json({
                error: 'All fields are required'
            });
        }
        // Format the event date to DD/MM/YYYY
        const formattedEventDate = format(new Date(event_date), 'MM/dd/yyyy');

        // Insert the event into the database
        const newEvent = await prisma.event.create({
            data: {
                event_name,
                event_date: formattedEventDate, // Use the formatted date here
            },
        });

        // Return to dashboard
        return res.redirect('/dashboard');

    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({
            error: 'An error occurred while creating the event'
        });
    }
}

exports.delete_event = async (req, res) => {

    try {

        // Insert the event into the database
        const deleteEvent = await prisma.event.delete({
            where: {
                id: Number(req.params.id),
            },
        })

        // Return to dashboard
        return res.redirect('/dashboard');

    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({
            error: 'An error occurred while creating the event'
        });
    }
}

exports.edit_event = async (req, res) => {

    try {

        let {
            edit_event_name,
            edit_event_date,
        } = req.body;

        // Insert the event into the database
        const updateEvent = await prisma.event.update({
            where: {
                id: Number(req.params.id),
            },
            data: {
                event_name: edit_event_name,
                event_date: edit_event_date,
            },
        })

        // Return to dashboard
        return res.redirect('/dashboard');

    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({
            error: 'An error occurred while editing the event'
        });
    }
}