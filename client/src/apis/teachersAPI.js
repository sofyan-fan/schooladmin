import RequestHandler from './RequestHandler';

export const get_teachers = async () => {
  const { data } = await RequestHandler.get('/general/teachers');
  return data;
};

export const add_teacher = async (teacherData) => {
  const response = await RequestHandler.post('/general/teacher', teacherData);
  return response.data;
};

export const update_teacher = async (teacherData) => {
  const { data } = await RequestHandler.put(
    `/general/teacher/${teacherData.id}`,
    teacherData
  );
  return data;
};

export const delete_teacher = async (teacherId) => {
  await RequestHandler.del(`/general/teacher/${teacherId}`);
  return teacherId;
};

const teachersAPI = {
  get_teachers,
  add_teacher,
  update_teacher,
  delete_teacher,
};

export default teachersAPI;
