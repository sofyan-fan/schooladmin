import RequestHandler from './RequestHandler';

const rosterAPI = {
  get_rosters: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await RequestHandler.get(`/dashboard/rosters?${params}`);
    return response.data;
  },
  add_roster: async (rosterData) => {
    const response = await RequestHandler.post(
      '/dashboard/rosters',
      rosterData
    );
    return response.data;
  },
  update_roster: async (id, rosterData) => {
    const response = await RequestHandler.put(
      `/dashboard/rosters/${id}`,
      rosterData
    );
    return response.data;
  },
  delete_roster: async (id) => {
    await RequestHandler.del(`/dashboard/rosters/${id}`);
  },
};

export default rosterAPI;
