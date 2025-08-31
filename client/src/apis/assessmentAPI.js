import RequestHandler from './RequestHandler';

const assessmentAPI = {
  // GET all tests
  getTests: async () => {
    const response = await RequestHandler.get('/general/assessments');
    return response.data || [];
  },
  
  // GET single test
  getTest: async (id) => {
    const response = await RequestHandler.get(`/general/assessments/${id}`);
    return response.data;
  },

  // CREATE test
  createTest: async (testData) => {
    const response = await RequestHandler.post('/general/assessments', testData);
    return response.data;
  },

  // UPDATE test
  updateTest: async (id, testData) => {
    const response = await RequestHandler.put(`/general/assessments/${id}`, testData);
    return response.data;
  },

  // DELETE test
  deleteTest: async (id) => {
    await RequestHandler.del(`/general/assessments/${id}`);
    return id;
  },

  // GET all exams
  getExams: async () => {
    const response = await RequestHandler.get('/general/assessments');
    return response.data;
  },

  // GET single exam
  getExam: async (id) => {
    const response = await RequestHandler.get(`/general/assessments/${id}`);
    return response.data;
  },

  // CREATE exam
  createExam: async (examData) => {
    const response = await RequestHandler.post('/general/assessments', examData);
    return response.data;
  },

  // UPDATE exam
  updateExam: async (id, examData) => {
    const response = await RequestHandler.put(`/general/assessments/${id}`, examData);
    return response.data;
  },

  // DELETE exam
  deleteExam: async (id) => {
    await RequestHandler.del(`/general/assessments/${id}`);
    return id;
  },

  // GET all assessments
  getAssessments: async () => {
    const response = await RequestHandler.get('/general/assessments');
    return response.data;
  },

  // Backward compatibility
  delete_test: async (id) => assessmentAPI.deleteTest(id),
  delete_exam: async (id) => assessmentAPI.deleteExam(id),
};

export default assessmentAPI;
