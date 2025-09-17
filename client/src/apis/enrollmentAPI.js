import RequestHandler from './RequestHandler';

export const toggle_enrollment = async (student_id, enrollment_status) => {
  const { data } = await RequestHandler.put(
    `/auth/students/${student_id}/enrollment`,
    { enrollment_status }
  );
  return data?.student;
};

const enrollmentAPI = { toggle_enrollment };
export default enrollmentAPI;
