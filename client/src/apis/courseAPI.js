import RequestHandler from './RequestHandler';

const courseApi = {
  async get_courses() {
    const response = await RequestHandler.get('/courses/courses');
    return response.data.courses || response.data;
  },

  async get_course_by_id(courseId) {
    const response = await RequestHandler.get(`/courses/courses/${courseId}`);
    return response.data;
  },

  async get_course_modules(courseId) {
    // This endpoint seems to fetch enriched modules, maybe adjust if you have a specific one per course
    const response = await RequestHandler.get(
      `/courses/courses/${courseId}/modules`
    );
    return response.data;
  },

  async add_course(courseData) {
    // The data from the form should be courseData = { name, description, price, moduleIds: [...] }
    const payload = {
      name: courseData.name,
      description: courseData.description,
      price: parseFloat(courseData.price) || 0,
      module_ids: courseData.moduleIds || [],
    };
    const response = await RequestHandler.post('/courses/courses', payload);
    return response.data;
  },

  async update_course(courseData) {
    // The data from the form should be courseData = { id, name, description, price, moduleIds: [...] }
    const payload = {
      name: courseData.name,
      description: courseData.description,
      price: parseFloat(courseData.price) || 0,
      module_ids: courseData.moduleIds || [],
    };
    const response = await RequestHandler.put(
      `/courses/courses/${courseData.id}`,
      payload
    );
    return response.data;
  },

  async delete_course(courseId) {
    await RequestHandler.del(`/courses/courses/${courseId}`);
    return courseId;
  },
};

export default courseApi;
