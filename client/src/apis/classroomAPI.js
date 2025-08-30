import RequestHandler from './RequestHandler';

export const getClassrooms = async () => {
  const { data } = await RequestHandler.get('/general/classrooms');
  return data;
};

export const addClassroom = async (classroomData) => {
  const response = await RequestHandler.post(
    '/general/classrooms',
    classroomData
  );
  return response.data;
};

export const updateClassroom = async (classroomData) => {
  const { data } = await RequestHandler.put(
    `/general/classrooms/${classroomData.id}`,
    classroomData
  );
  return data;
};

export const deleteClassroom = async (classroomId) => {
  await RequestHandler.del(`/general/classrooms/${classroomId}`);
  return classroomId;
};

const classroomAPI = {
  getClassrooms,
  addClassroom,
  updateClassroom,
  deleteClassroom,
};

export default classroomAPI;
