const { prisma } = require("../prisma/connection");

exports.event = async (req, res) => {

  console.log("hello");
  
  try {
    // Extract event details from the request body
    const { event_name, event_date, start_date, end_date } = req.body;
  
    // Validate the input
    if (!event_name || !event_date || !start_date || !end_date) {
      return res.status(400).json({ error: 'All fields are required' });
    }
  
    // Insert the event into the database
    const newEvent = await prisma.event.create({
      data: {
        event_name,
        event_date,
        start_date,
        end_date,
      },
    });
  
    // Return success response
    res.status(201).json({ message: 'Event created successfully', event: newEvent });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'An error occurred while creating the event' });
  } finally {
    // Disconnect Prisma Client
    await prisma.$disconnect();
  }

  res.render('dashboard/dashboard');

}