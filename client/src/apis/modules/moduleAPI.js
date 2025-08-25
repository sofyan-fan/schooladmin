import RequestHandler from '../RequestHandler';

const moduleAPI = {
  async get_modules() {
    const response = await RequestHandler.get('/api/modules');
    return response.data;
  },

  async get_module_details(moduleId) {
    const response = await RequestHandler.get(`/api/modules/${moduleId}`);
    return response.data;
  },

  async add_module(moduleData) {
    const response = await RequestHandler.post('/api/modules', moduleData);
    return response.data;
  },

  async update_module(moduleData) {
    const response = await RequestHandler.put(
      `/api/modules/${moduleData.id}`,
      moduleData
    );
    return response.data;
  },

  async delete_module(moduleId) {
    await RequestHandler.del(`/api/modules/${moduleId}`);
    return moduleId;
  },
};

export default moduleAPI;
