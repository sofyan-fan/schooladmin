import RequestHandler from '../RequestHandler';

const BASE_URL = '/dashboard/roster';

export const get_rosters = async () => {
  const response = await RequestHandler.get(`${BASE_URL}?_expand=class`);
  return response.data;
};

export const add_roster = async (rosterData) => {
  const response = await RequestHandler.post(BASE_URL, rosterData);
  return response.data;
};

export const delete_roster = async (id) => {
  const response = await RequestHandler.del(`${BASE_URL}/${id}`);
  return response.data;
};

export const edit_roster = async (rosterData) => {
  const response = await RequestHandler.put(
    `${BASE_URL}/${rosterData.id}`,
    rosterData
  );
  return response.data;
};

const rosterApi = {
  get_rosters,
  add_roster,
  delete_roster,
  edit_roster,
};

export default rosterApi;
