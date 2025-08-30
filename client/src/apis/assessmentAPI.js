import RequestHandler from './RequestHandler';

const assessmentAPI = {
  // GET all tests
  getTests: async () => {
    const response = await RequestHandler.get('/tests');
    return response.data;
  },

  // GET all exams
  getExams: async () => {
    const response = await RequestHandler.get('/exams');
    return response.data;
  },
};

export default assessmentAPI;
