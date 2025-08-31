const { prisma } = require('../../prisma/connection');

exports.get_events = async (req, res) => {
  try {
    const events = await prisma.events.findMany();
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      error: 'An error occurred while fetching events',
    });
  }
};

exports.create_event = async (req, res) => {
  try {
    let { event_name, event_date, description, start_time, end_time } =
      req.body;

    if (!event_name || !event_date) {
      return res.status(400).json({
        error: 'All fields are required',
      });
    }

    const newEvent = await prisma.events.create({
      data: {
        name: event_name,
        date: new Date(event_date),
        description: description || '',
        start_time: start_time || '',
        end_time: end_time || '',
      },
    });

    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      error: 'An error occurred while creating the event',
    });
  }
};

exports.delete_event = async (req, res) => {
  try {
    const deletedEvent = await prisma.events.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    res.status(200).json({
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      error: 'An error occurred while deleting the event',
    });
  }
};

exports.edit_event = async (req, res) => {
  try {
    const { event_name, event_date, description, start_time, end_time } =
      req.body;

    const updatedEvent = await prisma.events.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        name: event_name,
        date: new Date(event_date),
        description,
        start_time: start_time || '',
        end_time: end_time || '',
      },
    });

    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('Error editing event:', error);
    res.status(500).json({
      error: 'An error occurred while editing the event',
    });
  }
};
