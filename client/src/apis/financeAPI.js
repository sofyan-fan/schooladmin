import RequestHandler from './RequestHandler';

const baseUrl = '/general';

const financeAPI = {
  // Financial Types
  async create_financial_type(payload) {
    const response = await RequestHandler.post(
      `${baseUrl}/financial_types`,
      payload
    );
    return response.data;
  },

  async get_financial_types() {
    const response = await RequestHandler.get(`${baseUrl}/financial_types`);
    return response.data;
  },

  async update_financial_type(id, payload) {
    const response = await RequestHandler.put(
      `${baseUrl}/financial_types/${id}`,
      payload
    );
    return response.data;
  },

  async delete_financial_type(id) {
    const response = await RequestHandler.del(
      `${baseUrl}/financial_types/${id}`
    );
    return response.data;
  },

  // Financial Logs
  async create_financial_log(payload) {
    const response = await RequestHandler.post(
      `${baseUrl}/financial_logs`,
      payload
    );
    return response.data;
  },

  async get_financial_logs(filters = {}) {
    const params = new URLSearchParams();
    if (filters.school_year_id) {
      params.set('school_year_id', String(filters.school_year_id));
    }
    if (filters.student_id) {
      params.set('student_id', String(filters.student_id));
    }
    const query = params.toString();
    const url = query
      ? `${baseUrl}/financial_logs?${query}`
      : `${baseUrl}/financial_logs`;
    const response = await RequestHandler.get(url);
    return response.data;
  },

  async update_financial_log(id, payload) {
    const response = await RequestHandler.put(
      `${baseUrl}/financial_logs/${id}`,
      payload
    );
    return response.data;
  },

  async delete_financial_log(id) {
    const response = await RequestHandler.del(
      `${baseUrl}/financial_logs/${id}`
    );
    return response.data;
  },
};

export default financeAPI;
