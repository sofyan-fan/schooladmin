import RequestHandler from '../RequestHandler';

export const getEvents = async () => {
  const response = await RequestHandler.get('/api/events');
  return response.data;
};

export const addEvent = async (event) => {
  const response = await RequestHandler.post('/api/events', event);
  return response.data;
};

export const updateEvent = async (event) => {
  const response = await RequestHandler.put(`/api/events/${event.id}`, event);
  return response.data;
};

export const deleteEvent = async (id) => {
  await RequestHandler.del(`/api/events/${id}`);
  return id;
};

const eventAPI = {
  getEvents,
  addEvent,
  updateEvent,
  deleteEvent,
};

export default eventAPI;
