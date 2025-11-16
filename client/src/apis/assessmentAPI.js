import RequestHandler from './RequestHandler';

const assessmentApi = {
  getAssessments: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.school_year_id) {
      searchParams.set('school_year_id', String(params.school_year_id));
    }
    const query = searchParams.toString();
    const url = query
      ? `/general/assessments?${query}`
      : '/general/assessments';
    const response = await RequestHandler.get(url);
    return response.data;
  },

  getAssessment: async (id) => {
    const response = await RequestHandler.get(`/general/assessments/${id}`);
    return response.data;
  },

  createAssessment: async (assessmentData) => {
    const response = await RequestHandler.post(
      '/general/assessments',
      assessmentData
    );
    return response.data;
  },

  updateAssessment: async (id, assessmentData) => {
    const response = await RequestHandler.put(
      `/general/assessments/${id}`,
      assessmentData
    );
    return response.data;
  },

  deleteAssessment: async (id) => {
    await RequestHandler.del(`/general/assessments/${id}`);
    return id;
  },

  // Backward compatibility + old functions to remove later
  getTests: () => assessmentApi.getAssessments(),
  getTest: (id) => assessmentApi.getAssessment(id),
  createTest: (data) => assessmentApi.createAssessment(data),
  updateTest: (id, data) => assessmentApi.updateAssessment(id, data),
  deleteTest: (id) => assessmentApi.deleteAssessment(id),

  getExams: () => assessmentApi.getAssessments(),
  getExam: (id) => assessmentApi.getAssessment(id),
  createExam: (data) => assessmentApi.createAssessment(data),
  updateExam: (id, data) => assessmentApi.updateAssessment(id, data),
  deleteExam: (id) => assessmentApi.deleteAssessment(id),

  delete_test: (id) => assessmentApi.deleteAssessment(id),
  delete_exam: (id) => assessmentApi.deleteAssessment(id),
};

export default assessmentApi;
