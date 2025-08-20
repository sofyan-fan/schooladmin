import RequestHandler from '../RequestHandler';

const BASE_URL = '/classrooms';

export const get_classrooms = async () => {
  const response = await RequestHandler.get(BASE_URL);
  return response.data;
};

export const add_classroom = async (classroomData) => {
  const response = await RequestHandler.post(BASE_URL, classroomData);
  return response.data;
};

export const delete_classroom = async (id) => {
  const response = await RequestHandler.del(`${BASE_URL}/${id}`);
  return response.data;
};

export const edit_classroom = async (classroomData) => {
  const response = await RequestHandler.put(
    `${BASE_URL}/${classroomData.id}`,
    classroomData
  );
  return response.data;
};

const classroomApi = {
  get_classrooms,
  add_classroom,
  delete_classroom,
  edit_classroom,
};

export default classroomApi;
