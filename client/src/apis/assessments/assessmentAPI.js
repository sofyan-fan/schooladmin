import RequestHandler from '../RequestHandler';

const TESTS_URL = '/tests';
const EXAMS_URL = '/exams';

// Test API
export const get_tests = async () => {
  const response = await RequestHandler.get(TESTS_URL);
  return response.data;
};

export const add_test = async (testData) => {
  const response = await RequestHandler.post(TESTS_URL, testData);
  return response.data;
};

export const delete_test = async (id) => {
  const response = await RequestHandler.del(`${TESTS_URL}/${id}`);
  return response.data;
};

export const edit_test = async (testData) => {
  const response = await RequestHandler.put(
    `${TESTS_URL}/${testData.id}`,
    testData
  );
  return response.data;
};

// Exam API
export const get_exams = async () => {
  const response = await RequestHandler.get(EXAMS_URL);
  return response.data;
};

export const add_exam = async (examData) => {
  const response = await RequestHandler.post(EXAMS_URL, examData);
  return response.data;
};

export const delete_exam = async (id) => {
  const response = await RequestHandler.del(`${EXAMS_URL}/${id}`);
  return response.data;
};

export const edit_exam = async (examData) => {
  const response = await RequestHandler.put(
    `${EXAMS_URL}/${examData.id}`,
    examData
  );
  return response.data;
};

const assessmentApi = {
  get_tests,
  add_test,
  delete_test,
  edit_test,
  get_exams,
  add_exam,
  delete_exam,
  edit_exam,
};

export default assessmentApi;
