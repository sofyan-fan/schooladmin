import RequestHandler from '../RequestHandler';

const BASE_URL = '/general/subjects'; // or '/general/subjects' if you have a rewrite rule

export const get_subjects = async () => {
  const response = await RequestHandler.get(`${BASE_URL}`);
  return response.data;
};

export const add_subject = async (subject) => {
  const response = await RequestHandler.post(`${BASE_URL}`, subject);
  return response.data;
};

export const delete_subject = async (id) => {
  const response = await RequestHandler.del(`${BASE_URL}/${id}`);
  return response.data;
};

export const edit_subject = async (subject) => {
  const response = await RequestHandler.put(`${BASE_URL}/${subject.id}`, subject);
  return response.data;
};

const subjectApi = {
  get_subjects,
  add_subject,
  delete_subject,
  edit_subject,
};

export default subjectApi;
