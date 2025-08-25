import RequestHandler from '../RequestHandler';

export const get_subjects = async () => {
  const { data } = await RequestHandler.get('/api/subjects');
  return data;
};

export const add_subject = async (subjectData) => {
  const response = await RequestHandler.post('/api/subjects', subjectData);
  return response.data;
};

export const update_subject = async (subjectData) => {
  const { data } = await RequestHandler.put(
    `/api/subjects/${subjectData.id}`,
    subjectData
  );
  return data;
};

export const delete_subject = async (subjectId) => {
  await RequestHandler.del(`/api/subjects/${subjectId}`);
  return subjectId;
};

const subjectAPI = {
  get_subjects,
  add_subject,
  update_subject,
  delete_subject,
};

export default subjectAPI;
