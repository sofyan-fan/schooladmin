import RequestHandler from '../RequestHandler';

const BASE_URL = '/general/coursemodules';

export const get_coursemodules = async () => {
  const response = await RequestHandler.get('/course/modules');
  return response.data;
};

export const add_coursemodule = async (coursemodule) => {
  const response = await RequestHandler.post(BASE_URL, coursemodule);
  return response.data;
};

export const delete_coursemodule = async (id) => {
  const response = await RequestHandler.del(`${BASE_URL}/${id}`);
  return response.data;
};

export const edit_coursemodule = async (coursemodule) => {
  const response = await RequestHandler.put(
    `${BASE_URL}/${coursemodule.id}`,
    coursemodule
  );
  return response.data;
};

const courseModuleApi = {
  get_coursemodules,
  add_coursemodule,
  delete_coursemodule,
  edit_coursemodule,
};

export default courseModuleApi;
