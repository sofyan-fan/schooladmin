import RequestHandler from './RequestHandler';

export const get_classes = async () => {
  const { data } = await RequestHandler.get('/general/class_layouts');
  return data;
};

export const add_class = async (classData) => {
  const response = await RequestHandler.post(
    '/general/class_layouts',
    classData
  );
  return response.data;
};

export const delete_class = async (id) => {
  await RequestHandler.del(`/general/class_layouts/${id}`);
  return id;
};

export const update_class = async (classData) => {
  const response = await RequestHandler.put(
    `/general/class_layouts/${classData.id}`,
    classData
  );
  return response.data;
};

const classAPI = {
  get_classes,
  add_class,
  delete_class,
  update_class,
};

export default classAPI;
