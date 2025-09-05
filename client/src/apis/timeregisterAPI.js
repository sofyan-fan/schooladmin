import RequestHandler from './RequestHandler';

const BASE_URL = '/general';

// Time Registration API functions
export const timeRegisterAPI = {
  // Create a new time registration
  createTimeRegistration: async (data) => {
    const response = await RequestHandler.post(
      `${BASE_URL}/time-registrations`,
      data
    );
    return response.data;
  },

  // Update an existing time registration
  updateTimeRegistration: async (id, data) => {
    const response = await RequestHandler.put(
      `${BASE_URL}/time-registrations/${id}`,
      data
    );
    return response.data;
  },

  // Approve a time registration (admin only)
  approveTimeRegistration: async (id, adminId) => {
    const response = await RequestHandler.put(
      `${BASE_URL}/time-registrations/${id}/approve`,
      {
        admin_id: adminId,
      }
    );
    return response.data;
  },

  // Get all time registrations for a specific teacher
  getTeacherTimeRegistrations: async (teacherId) => {
    const response = await RequestHandler.get(
      `${BASE_URL}/time-registrations/teacher/${teacherId}`
    );
    return response.data;
  },

  // Get all time registrations (admin only)
  getAllTimeRegistrations: async () => {
    const response = await RequestHandler.get(`${BASE_URL}/time-registrations`);
    return response.data;
  },
};

// Absence API functions (also in time registration controller)
export const absenceAPI = {
  // Create a new absence
  createAbsence: async (data) => {
    const response = await RequestHandler.post(`${BASE_URL}/absences`, data);
    return response.data;
  },

  // Get all absences
  getAllAbsences: async () => {
    const response = await RequestHandler.get(`${BASE_URL}/absences`);
    return response.data;
  },

  // Get absence by ID
  getAbsenceById: async (id) => {
    const response = await RequestHandler.get(`${BASE_URL}/absences/${id}`);
    return response.data;
  },

  // Update an absence
  updateAbsence: async (id, data) => {
    const response = await RequestHandler.put(
      `${BASE_URL}/absences/${id}`,
      data
    );
    return response.data;
  },

  // Delete an absence
  deleteAbsence: async (id) => {
    const response = await RequestHandler.delete(`${BASE_URL}/absences/${id}`);
    return response.data;
  },
};

export default { timeRegisterAPI, absenceAPI };
