import RequestHandler from '../RequestHandler';

const courseApi = {
  async get_courses() {
    const response = await RequestHandler.get('/api/courses');
    return response.data;
  },

  async get_course_modules(courseId) {
    // This endpoint seems to fetch enriched modules, maybe adjust if you have a specific one per course
    const response = await RequestHandler.get(
      `/api/courses/${courseId}/modules`
    );
    return response.data;
  },

  async add_course(courseData) {
    const response = await RequestHandler.post('/api/courses', courseData);
    return response.data;
  },

  async update_course(courseData) {
    const response = await RequestHandler.put(
      `/api/courses/${courseData.id}`,
      courseData
    );
    return response.data;
  },

  async delete_course(courseId) {
    await RequestHandler.del(`/api/courses/${courseId}`);
    return courseId;
  },
};

export default courseApi;
