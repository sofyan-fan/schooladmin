import RequestHandler from '../RequestHandler';

const BASE_URL = '/dashboard/event';

export const get_events = async () => {
  const response = await RequestHandler.get(BASE_URL);
  return response.data;
};

export const add_event = async (event) => {
  const response = await RequestHandler.post(BASE_URL, event);
  return response.data;
};

export const deleteEvent = async (id) => {
  const response = await RequestHandler.del(`${BASE_URL}/${id}`);
  return response.data;
};

export const editEvent = async (event) => {
  const response = await RequestHandler.put(`${BASE_URL}/${event.id}`, event);
  return response.data;
};

const eventAPI = {
  get_events,
  add_event,
  deleteEvent,
  editEvent,
};

export default eventAPI;
