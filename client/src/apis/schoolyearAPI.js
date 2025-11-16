import RequestHandler from './RequestHandler';

const baseUrl = '/general/school-years';

const schoolyearAPI = {
  // List school years with optional filters
  // params: { includeArchived?: boolean, active?: boolean }
  async getSchoolYears(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.active) {
      searchParams.set('active', 'true');
    } else if (params.includeArchived) {
      searchParams.set('includeArchived', 'true');
    }
    const query = searchParams.toString();
    const url = query ? `${baseUrl}?${query}` : baseUrl;
    const response = await RequestHandler.get(url);
    return response.data;
  },

  // Get the single active school year
  async getActiveSchoolYear() {
    const response = await RequestHandler.get(`${baseUrl}/active`);
    return response.data;
  },

  // Get a school year by id
  async getSchoolYearById(id) {
    const response = await RequestHandler.get(`${baseUrl}/${id}`);
    return response.data;
  },

  // Create a new school year
  async createSchoolYear(payload) {
    const response = await RequestHandler.post(baseUrl, payload);
    return response.data.school_year || response.data;
  },

  // Update an existing school year
  async updateSchoolYear(id, payload) {
    const response = await RequestHandler.put(`${baseUrl}/${id}`, payload);
    return response.data.school_year || response.data;
  },

  // Activate a school year (deactivates others)
  async activateSchoolYear(id) {
    const response = await RequestHandler.put(`${baseUrl}/${id}/activate`);
    return response.data.school_year || response.data;
  },

  // Archive a school year
  async archiveSchoolYear(id) {
    const response = await RequestHandler.put(`${baseUrl}/${id}/archive`);
    return response.data.school_year || response.data;
  },
};

export default schoolyearAPI;