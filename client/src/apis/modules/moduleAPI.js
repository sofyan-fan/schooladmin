import RequestHandler from '../RequestHandler';

const BASE_URL = '/courses/modules';

export const get_modules = async () => {
  const response = await RequestHandler.get(BASE_URL);
  return response.data;
};

export const add_module = async (module) => {
  const response = await RequestHandler.post(BASE_URL, module);
  return response.data;
};

export const delete_module = async (id) => {
  const response = await RequestHandler.del(`${BASE_URL}/${id}`);
  return response.data;
};

export const edit_module = async (module) => {
  const response = await RequestHandler.put(`${BASE_URL}/${module.id}`, module);
  return response.data;
};

const moduleApi = {
  get_modules,
  add_module,
  delete_module,
  edit_module,
};

export default moduleApi;
