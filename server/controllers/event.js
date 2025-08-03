const { prisma } = require('../prisma/connection');

exports.get_events = (req, res) => {
  res.status(200).json({ message: 'get_events not implemented' });
};

exports.create_event = async (req, res) => {
  const { title, date, time, description } = req.body;
  try {
    const newEvent = await prisma.events.create({
      data: {
        name: title,
        date: new Date(date),
        start_time: time,
        end_time: '',
        description: description,
      },
    });
    res.status(201).json(newEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.delete_event = (req, res) => {
  res.status(200).json({ message: 'delete_event not implemented' });
};

exports.edit_event = async (req, res) => {
  const { id, name, date, time, description } = req.body;
  try {
    const updatedEvent = await prisma.events.update({
      where: { id },
      data: { name, date, time, description },
    });
    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
