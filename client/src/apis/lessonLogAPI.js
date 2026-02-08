import RequestHandler from './RequestHandler';

/**
 * API module for lesson log operations.
 * Replaces the localStorage-based lessonLogStorage utility.
 */
const lessonLogAPI = {
  /**
   * Get all lesson logs with optional filters.
   * @param {Object} filters - Optional filters (roster_id, teacher_id, type, from_date, to_date)
   * @returns {Promise<Array>} - Array of lesson log objects
   */
  getAllLogs: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    const queryString = params.toString();
    const url = queryString ? `/general/lesson-logs?${queryString}` : '/general/lesson-logs';
    const response = await RequestHandler.get(url);
    return response.data;
  },

  /**
   * Get a single lesson log by ID.
   * @param {number} id - The lesson log ID
   * @returns {Promise<Object>} - The lesson log object
   */
  getLogById: async (id) => {
    const response = await RequestHandler.get(`/general/lesson-logs/${id}`);
    return response.data;
  },

  /**
   * Get a lesson log by roster ID and date.
   * @param {number} rosterId - The roster ID
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {Promise<Object|null>} - The lesson log or null if not found
   */
  getLogByRosterDate: async (rosterId, date) => {
    const response = await RequestHandler.get(
      `/general/lesson-logs/by-roster-date?roster_id=${rosterId}&date=${date}`
    );
    return response.data; // Returns null when no log exists for this roster/date
  },

  /**
   * Get all logs for a specific roster.
   * @param {number} rosterId - The roster ID
   * @returns {Promise<Array>} - Array of lesson logs for this roster
   */
  getLogsForRoster: async (rosterId) => {
    const response = await RequestHandler.get(`/general/lesson-logs/roster/${rosterId}`);
    return response.data;
  },

  /**
   * Create or update a lesson log (upsert by roster_id + date).
   * @param {Object} logData - The log data
   * @param {number} logData.roster_id - The roster ID
   * @param {number} logData.teacher_id - The teacher ID
   * @param {string} logData.teacher_name - The teacher name
   * @param {string} logData.date - The date in YYYY-MM-DD format
   * @param {string} logData.content - The log content
   * @param {string} [logData.type='les'] - The log type ('les' or 'quran')
   * @returns {Promise<Object>} - The created/updated lesson log
   */
  saveLog: async (logData) => {
    const response = await RequestHandler.post('/general/lesson-logs', logData);
    return response.data;
  },

  /**
   * Update a lesson log by ID.
   * @param {number} id - The lesson log ID
   * @param {Object} updateData - The data to update (content, type, teacher_id, teacher_name)
   * @returns {Promise<Object>} - The updated lesson log
   */
  updateLog: async (id, updateData) => {
    const response = await RequestHandler.put(`/general/lesson-logs/${id}`, updateData);
    return response.data;
  },

  /**
   * Delete a lesson log by ID.
   * @param {number} id - The lesson log ID
   * @returns {Promise<void>}
   */
  deleteLog: async (id) => {
    await RequestHandler.del(`/general/lesson-logs/${id}`);
  },
};

// Log types constant for consistency
export const LOG_TYPES = {
  LES: 'les',
  QURAN: 'quran',
};

export default lessonLogAPI;
