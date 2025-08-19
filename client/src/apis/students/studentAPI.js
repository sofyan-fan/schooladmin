import RequestHandler from '../RequestHandler';

const BASE_URL = '/students';

export const get_students = async () => {
  const response = await RequestHandler.get(BASE_URL);
  return response.data;
};

export const update_student = async (id, data) => {
  const response = await RequestHandler.put(`${BASE_URL}/${id}`, data);
  return response.data;
};

export const delete_student = async (id) => {
  const response = await RequestHandler.del(`${BASE_URL}/${id}`);
  return response.data;
};

const studentAPI = {
  get_students,
  update_student,
  delete_student,
};

export default studentAPI;
