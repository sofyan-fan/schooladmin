import RequestHandler from './RequestHandler';

export const get_events = async () => {
  const response = await RequestHandler.get('/dashboard/event');
  return response.data;
};

export const add_event = async (event) => {
  const response = await RequestHandler.post('/dashboard/event', event);
  return response.data;
};

export const update_event = async (event) => {
  const response = await RequestHandler.put(
    `/dashboard/event/${event.id}`,
    event
  );
  return response.data;
};

export const delete_event = async (id) => {
  await RequestHandler.del(`/dashboard/event/${id}`);
  return id;
};

const eventAPI = {
  get_events,
  add_event,
  update_event,
  delete_event,
};

export default eventAPI;
