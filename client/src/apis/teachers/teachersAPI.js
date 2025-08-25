import RequestHandler from '../RequestHandler';

export const get_teachers = async () => {
  const { data } = await RequestHandler.get('/api/teachers');
  return data;
};

export const add_teacher = async (teacherData) => {
  const response = await RequestHandler.post('/api/teachers', teacherData);
  return response.data;
};

export const update_teacher = async (teacherData) => {
  const { data } = await RequestHandler.put(
    `/api/teachers/${teacherData.id}`,
    teacherData
  );
  return data;
};

export const delete_teacher = async (teacherId) => {
  await RequestHandler.del(`/api/teachers/${teacherId}`);
  return teacherId;
};

const teachersAPI = {
  get_teachers,
  add_teacher,
  update_teacher,
  delete_teacher,
};

export default teachersAPI;
