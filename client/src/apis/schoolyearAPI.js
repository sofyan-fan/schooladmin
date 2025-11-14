import RequestHandler from './RequestHandler';

const schoolyearAPI = {
  getSchoolYears: async () => {
    const response = await RequestHandler.get('/general/school-years');
    return response.data;
  },
};

export default schoolyearAPI;