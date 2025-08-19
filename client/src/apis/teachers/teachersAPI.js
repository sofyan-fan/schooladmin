import RequestHandler from '../RequestHandler';

const BASE_URL = '/teachers';

export const get_teachers = async () => {
  const response = await RequestHandler.get(BASE_URL);
  return response.data;
};

export const update_teacher = async (id, data) => {
  const response = await RequestHandler.put(`${BASE_URL}/${id}`, data);
  return response.data;
};

export const delete_teacher = async (id) => {
  const response = await RequestHandler.del(`${BASE_URL}/${id}`);
  return response.data;
};

const teachersAPI = {
  get_teachers,
  update_teacher,
  delete_teacher,
};

export default teachersAPI;
