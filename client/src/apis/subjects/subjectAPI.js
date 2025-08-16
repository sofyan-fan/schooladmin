import RequestHandler from '../RequestHandler';

// const BASE_URL = '/subjects';

export const get_subjects = async () => {
  const response = await RequestHandler.get('/subjects');
  return response.data;
};

export const add_subject = async (subject) => {
  const response = await RequestHandler.post('/subjects', subject);
  return response.data;
};

export const delete_subject = async (id) => {
  const response = await RequestHandler.del(`/subjects/${id}`);
  return response.data;
};

export const edit_subject = async (subject) => {
  const response = await RequestHandler.put(
    `/subjects/${subject.id}`,
    subject
  );
  return response.data;
};

const subjectApi = {
  get_subjects,
  add_subject,
  delete_subject,
  edit_subject,
};

export default subjectApi;
