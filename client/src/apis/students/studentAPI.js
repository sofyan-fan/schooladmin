import RequestHandler from '../RequestHandler';

export const get_students = async () => {
  const { data } = await RequestHandler.get('/api/students');
  return data;
};

export const add_student = async (studentData) => {
  const response = await RequestHandler.post('/api/students', studentData);
  return response.data;
};

export const update_student = async (studentData) => {
  const { data } = await RequestHandler.put(
    `/api/students/${studentData.id}`,
    studentData
  );
  return data;
};

export const delete_student = async (studentId) => {
  await RequestHandler.del(`/api/students/${studentId}`);
  return studentId;
};

const studentAPI = {
  get_students,
  add_student,
  update_student,
  delete_student,
};

export default studentAPI;
