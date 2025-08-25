import RequestHandler from '../RequestHandler';

export const getClassrooms = async () => {
  const { data } = await RequestHandler.get('/api/classrooms');
  return data;
};

export const addClassroom = async (classroomData) => {
  const response = await RequestHandler.post('/api/classrooms', classroomData);
  return response.data;
};

export const updateClassroom = async (classroomData) => {
  const { data } = await RequestHandler.put(
    `/api/classrooms/${classroomData.id}`,
    classroomData
  );
  return data;
};

export const deleteClassroom = async (classroomId) => {
  await RequestHandler.del(`/api/classrooms/${classroomId}`);
  return classroomId;
};

const classroomAPI = {
  getClassrooms,
  addClassroom,
  updateClassroom,
  deleteClassroom,
};

export default classroomAPI;
