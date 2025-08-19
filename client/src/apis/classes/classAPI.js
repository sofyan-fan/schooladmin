import RequestHandler from '../RequestHandler';

const BASE_URL = '/classes';

export const get_classes = async () => {
  const response = await RequestHandler.get(
    `${BASE_URL}?_expand=teacher&_embed=courses&_embed=students`
  );
  return response.data;
};

export const add_class = async (classData) => {
  const response = await RequestHandler.post(BASE_URL, classData);
  return response.data;
};

export const delete_class = async (id) => {
  const response = await RequestHandler.del(`${BASE_URL}/${id}`);
  return response.data;
};

export const edit_class = async (classData) => {
  const response = await RequestHandler.put(
    `${BASE_URL}/${classData.id}`,
    classData
  );
  return response.data;
};

const classApi = {
  get_classes,
  add_class,
  delete_class,
  edit_class,
};

export default classApi;
