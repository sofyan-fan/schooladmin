
import RequestHandler from '../RequestHandler';

const BASE_URL = '/courses'; // The base URL is now /courses

export const get_courses = async () => {
  const response = await RequestHandler.get(BASE_URL);
  return response.data;
};

// This function will now send moduleIds
export const add_course = async (course) => {
  const response = await RequestHandler.post(BASE_URL, course);
  return response.data;
};

export const delete_course = async (id) => {
  const response = await RequestHandler.del(`${BASE_URL}/${id}`);
  return response.data;
};

export const edit_course = async (course) => {
  const response = await RequestHandler.put(`${BASE_URL}/${course.id}`, course);
  return response.data;
};

const courseApi = {
  get_courses,
  add_course,
  delete_course,
  edit_course,
};

export default courseApi;