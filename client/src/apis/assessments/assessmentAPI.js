import RequestHandler from '../RequestHandler';

const assessmentAPI = {
  // GET all tests
  getTests: async () => {
    const response = await RequestHandler.get('/api/tests');
    return response.data;
  },

  // GET all exams
  getExams: async () => {
    const response = await RequestHandler.get('/api/exams');
    return response.data;
  },
};

export default assessmentAPI;
