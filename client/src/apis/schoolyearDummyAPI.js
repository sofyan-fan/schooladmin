import RequestHandler from './RequestHandler';

const baseUrl = '/dummy/school-years';

const schoolyearDummyAPI = {
  async list() {
    const response = await RequestHandler.get(baseUrl);
    return response.data || [];
  },

  async getById(id) {
    const response = await RequestHandler.get(`${baseUrl}/${id}`);
    return response.data || response;
  },
};

export default schoolyearDummyAPI;


