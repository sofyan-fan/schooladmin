import RequestHandler from './RequestHandler';

export const get_subjects = async () => {
  const { data } = await RequestHandler.get('/subjects/subjects');
  return data;
};

export const add_subject = async (subjectData) => {
  const response = await RequestHandler.post('/subjects/subjects', subjectData);
  return response.data;
};

export const update_subject = async (subjectData) => {
  const { data } = await RequestHandler.put(
    `/subjects/subjects/${subjectData.id}`,
    subjectData
  );
  return data;
};

export const delete_subject = async (subjectId) => {
  await RequestHandler.del(`/subjects/subjects/${subjectId}`);
  return subjectId;
};

const subjectAPI = {
  get_subjects,
  add_subject,
  update_subject,
  delete_subject,
};

export default subjectAPI;
