import RequestHandler from './RequestHandler';

const baseUrl = '/courses/modules';

const moduleAPI = {
  async get_modules() {
    const response = await RequestHandler.get(baseUrl);
    return response.data;
  },

  async get_module_details(moduleId) {
    const response = await RequestHandler.get(`${baseUrl}/${moduleId}`);
    return response.data;
  },

  async add_module(moduleData) {
    // Add default course_id since the database requires it
    const dataWithCourse = {
      ...moduleData,
      course_id: 1, // Default course ID
    };
    const response = await RequestHandler.post(baseUrl, dataWithCourse);
    return response.data;
  },

  async update_module(moduleData) {
    const response = await RequestHandler.put(
      `${baseUrl}/${moduleData.id}`,
      moduleData
    );
    return response.data;
  },

  async delete_module(moduleId) {
    await RequestHandler.del(`${baseUrl}/${moduleId}`);
    return moduleId;
  },
};

export default moduleAPI;
