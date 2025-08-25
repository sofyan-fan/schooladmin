import RequestHandler from '../RequestHandler';

export const get_classrooms = async () => {
  const { data } = await RequestHandler.get('/api/classrooms');
  return data;
};

export const add_classroom = async (classroomData) => {
  const response = await RequestHandler.post('/api/classrooms', classroomData);
  return response.data;
};

export const update_classroom = async (classroomData) => {
  const { data } = await RequestHandler.put(
    `/api/classrooms/${classroomData.id}`,
    classroomData
  );
  return data;
};

export const delete_classroom = async (classroomId) => {
  await RequestHandler.del(`/api/classrooms/${classroomId}`);
  return classroomId;
};

const classroomAPI = {
  get_classrooms,
  add_classroom,
  update_classroom,
  delete_classroom,
};

export default classroomAPI;
