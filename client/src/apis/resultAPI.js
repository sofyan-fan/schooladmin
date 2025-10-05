import RequestHandler from './RequestHandler';

export const get_all_results = async () => {
  const { data } = await RequestHandler.get('/general/result');
  return data;
};

export const get_results = async () => {
  // The original API call to the backend.
  const { data } = await RequestHandler.get('/general/results');
  return data;
};

export const add_result = async (resultData) => {
  const response = await RequestHandler.post('/general/results', resultData);
  return response.data;
};

export const update_result = async (resultData) => {
  const { data } = await RequestHandler.put(
    `/general/results/${resultData.id}`,
    resultData
  );
  return data;
};

export const delete_result = async (resultId) => {
  await RequestHandler.del(`/general/results/${resultId}`);
  return resultId;
};

const resultAPI = {
  get_results,
  add_result,
  update_result,
  delete_result,
};

export default resultAPI;
