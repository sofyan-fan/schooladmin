import RequestHandler from './RequestHandler';

export const get_classes = async () => {
  const { data } = await RequestHandler.get('/general/class_layouts');
  // Transform backend field names to match client expectations
  return data.map((cls) => ({
    ...cls,
    mentorId: cls.mentor_id,
    courseId: cls.course_id,
    // Keep the original fields too for backward compatibility
    mentor_id: cls.mentor_id,
    course_id: cls.course_id,
  }));
};

export const add_class = async (classData) => {
  // Transform client field names to match backend expectations
  const payload = {
    name: classData.name,
    mentor_id: classData.mentorId || null,
    course_id: classData.courseId || null,
  };

  // First create the class
  const response = await RequestHandler.post('/general/class_layouts', payload);

  const newClass = response.data.newClassLayout || response.data;

  // Then add students if any
  if (classData.studentIds && classData.studentIds.length > 0) {
    await RequestHandler.post(
      `/general/class_layouts/${newClass.id}/students`,
      { student_ids: classData.studentIds }
    );
    // Fetch the updated class with students
    const updatedResponse = await RequestHandler.get(
      `/general/class_layouts/${newClass.id}`
    );
    return updatedResponse.data;
  }

  return newClass;
};

export const delete_class = async (id) => {
  await RequestHandler.del(`/general/class_layouts/${id}`);
  return id;
};

export const update_class = async (classData) => {
  // Transform client field names to match backend expectations
  const payload = {
    name: classData.name,
    mentor_id: classData.mentorId || null,
    course_id: classData.courseId || null,
  };

  // First update the class basic info
  const response = await RequestHandler.put(
    `/general/class_layouts/${classData.id}`,
    payload
  );

  const updatedClass = response.data.updatedClassLayout || response.data;

  // Then update students if provided
  // Note: This replaces all students, not adding to existing ones
  if (classData.studentIds !== undefined) {
    // First, we need to clear existing students by updating them to null class_id
    // Then add the new students
    await RequestHandler.post(
      `/general/class_layouts/${classData.id}/students`,
      { student_ids: classData.studentIds || [] }
    );
    // Fetch the updated class with students
    const updatedResponse = await RequestHandler.get(
      `/general/class_layouts/${classData.id}`
    );
    return updatedResponse.data;
  }

  return updatedClass;
};

export const get_class = async (id) => {
  const { data } = await RequestHandler.get(`/general/class_layouts/${id}`);
  return {
    ...data,
    mentorId: data.mentor_id,
    courseId: data.course_id,
  };
};


const classAPI = {
  get_classes,
  add_class,
  delete_class,
  update_class,
  get_class,
};

export default classAPI;
