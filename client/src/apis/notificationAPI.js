import RequestHandler from './RequestHandler';

export const get_notifications = async () => {
  const response = await RequestHandler.get('/notifications');
  return response.data;
};

export const add_notification = async (notification) => {
  const response = await RequestHandler.post('/notifications', notification);
  return response.data;
};

export const update_notification = async (id, notification) => {
  const response = await RequestHandler.put(`/notifications/${id}`, notification);
  return response.data;
};

export const delete_notification = async (id) => {
  await RequestHandler.del(`/notifications/${id}`);
  return id;
};

const notificationAPI = {
  get_notifications,
  add_notification,
  update_notification,
  delete_notification,
};

export default notificationAPI;


