import RequestHandler from '../RequestHandler';


const BASE_URL = '/general/students';

export const get_students = async () => {
  const response = await RequestHandler.get(`${BASE_URL}`);
  return response.data;
};

const studentAPI = {
  get_students,
};

export default studentAPI;
