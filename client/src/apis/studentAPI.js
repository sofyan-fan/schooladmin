// ...existing imports
import RequestHandler from './RequestHandler';

export const get_students = async () => {
  const { data } = await RequestHandler.get('/general/students');
  return data;
};

export const get_student_by_id = async (id) => {
  const { data } = await RequestHandler.get(`/general/student/${id}`);
  return data;
};

export const add_student = async (studentData) => {
  const response = await RequestHandler.post('/general/student', studentData);
  return response.data;
};

export const update_student = async (id, studentData) => {
  const { data } = await RequestHandler.put(
    `/general/student/${id}`,
    studentData
  );
  return data;
};

export const delete_student = async (studentId) => {
  await RequestHandler.del(`/general/student/${studentId}`);
  return studentId;
};

const studentAPI = {
  get_students,
  get_student_by_id,
  add_student,
  update_student,
  delete_student,
};

export default studentAPI;
