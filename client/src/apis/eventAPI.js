import RequestHandler from './RequestHandler';

export const getEvents = async () => {
  const response = await RequestHandler.get('/dashboard/event');
  return response.data;
};

export const addEvent = async (event) => {
  const response = await RequestHandler.post('/dashboard/event', event);
  return response.data;
};

export const updateEvent = async (event) => {
  const response = await RequestHandler.put(
    `/dashboard/event/${event.id}`,
    event
  );
  return response.data;
};

export const deleteEvent = async (id) => {
  await RequestHandler.del(`/dashboard/event/${id}`);
  return id;
};

const eventAPI = {
  getEvents,
  addEvent,
  updateEvent,
  deleteEvent,
};

export default eventAPI;
