import RequestHandler from './RequestHandler';

export const get_mentor_students = async () => {
  const { data } = await RequestHandler.get('/general/mentor/students');
  return data;
};

const mentorAPI = {
  get_mentor_students,
};

export default mentorAPI;



