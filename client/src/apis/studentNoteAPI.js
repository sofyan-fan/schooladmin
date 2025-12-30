import RequestHandler from './RequestHandler';

export const get_student_notes = async (studentId) => {
  const { data } = await RequestHandler.get(
    `/general/students/${studentId}/notes`
  );
  return data;
};

export const create_student_note = async (studentId, payload) => {
  const { data } = await RequestHandler.post(
    `/general/students/${studentId}/notes`,
    payload
  );
  return data;
};

const studentNoteAPI = {
  get_student_notes,
  create_student_note,
};

export default studentNoteAPI;



