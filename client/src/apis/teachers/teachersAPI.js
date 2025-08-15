
import RequestHandler from '../RequestHandler';


const BASE_URL = '/general/teachers';

export const get_teachers = async () => {
  const response = await RequestHandler.get(`${BASE_URL}`);
  return response.data;
};

const teachersAPI = {
  get_teachers,
};

export default teachersAPI;
