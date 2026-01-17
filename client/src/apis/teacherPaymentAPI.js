import RequestHandler from './RequestHandler';

const BASE_URL = '/general';

const teacherPaymentAPI = {
  // Get all approved but unpaid time registrations grouped by teacher
  async getApprovedUnpaidRegistrations() {
    const response = await RequestHandler.get(
      `${BASE_URL}/teacher-payments/unpaid`
    );
    return response.data;
  },

  // Process a teacher payment
  async processPayment(data) {
    const response = await RequestHandler.post(
      `${BASE_URL}/teacher-payments`,
      data
    );
    return response.data;
  },

  // Get payment history (optionally filtered by teacher)
  async getPaymentHistory(teacherId = null) {
    const url = teacherId
      ? `${BASE_URL}/teacher-payments?teacher_id=${teacherId}`
      : `${BASE_URL}/teacher-payments`;
    const response = await RequestHandler.get(url);
    return response.data;
  },

  // Get a single payment by ID
  async getPaymentById(id) {
    const response = await RequestHandler.get(
      `${BASE_URL}/teacher-payments/${id}`
    );
    return response.data;
  },

  // Update teacher compensation rate
  async updateTeacherCompensation(teacherId, compensation) {
    const response = await RequestHandler.put(
      `${BASE_URL}/teachers/${teacherId}/compensation`,
      { compensation }
    );
    return response.data;
  },
};

export default teacherPaymentAPI;
