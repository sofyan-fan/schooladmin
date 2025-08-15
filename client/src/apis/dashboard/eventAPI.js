import RequestHandler from '../RequestHandler';

export const get_events = async () => {
  const response = await RequestHandler.get('dashboard/event');
  return response.data;
};

export const add_event = async (event) => {
  const response = await RequestHandler.post('dashboard/event', event);
  return response.data;
};

export const deleteEvent = async (id) => {
  const response = await RequestHandler.del(`dashboard/event/${id}`);
  return response.data;
};

export const editEvent = async (event) => {
  const response = await RequestHandler.put(
    `dashboard/event/${event.id}`,
    event
  );
  return response.data;
};

const eventAPI = {
  get_events,
  add_event,
  deleteEvent,
  editEvent,
};

export default eventAPI;
