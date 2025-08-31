import RequestHandler from './RequestHandler';

export const getClassrooms = async () => {
  const { data } = await RequestHandler.get('/general/classrooms');
  // Transform backend field names to match client expectations
  return data.map((classroom) => ({
    ...classroom,
    max_students: classroom.capacity,
    // Keep the original field too for backward compatibility
    capacity: classroom.capacity,
  }));
};

export const addClassroom = async (classroomData) => {
  // Transform client field names to match backend expectations
  const payload = {
    name: classroomData.name,
    capacity: classroomData.max_students, // Transform max_students to capacity
    description: classroomData.description || null,
  };

  const response = await RequestHandler.post('/general/classrooms', payload);

  const newClassroom = response.data.classroom || response.data;
  // Transform response back to client format
  return {
    ...newClassroom,
    max_students: newClassroom.capacity,
  };
};

export const updateClassroom = async (classroomData) => {
  // Transform client field names to match backend expectations
  const payload = {
    name: classroomData.name,
    capacity: classroomData.max_students, // Transform max_students to capacity
    description: classroomData.description || null,
  };

  const { data } = await RequestHandler.put(
    `/general/classrooms/${classroomData.id}`,
    payload
  );

  const updatedClassroom = data.updatedClassroom || data;
  // Transform response back to client format
  return {
    ...updatedClassroom,
    max_students: updatedClassroom.capacity,
  };
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
