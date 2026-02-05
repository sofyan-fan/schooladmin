/**
 * Utility for managing teacher lesson logs stored in localStorage.
 * 
 * Logs are keyed by roster ID and date, allowing teachers to keep
 * per-lesson notes for each occurrence of a recurring lesson.
 */

const STORAGE_KEY = 'teacher_lesson_logs';

/**
 * Generate a unique key for a lesson log entry.
 * @param {number|string} rosterId - The roster/lesson ID
 * @param {string} dateKey - The date in YYYY-MM-DD format
 */
const getLogKey = (rosterId, dateKey) => `${rosterId}_${dateKey}`;

/**
 * Get all logs from localStorage.
 * @returns {Object} - All lesson logs keyed by rosterId_date
 */
export const getAllLogs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to read lesson logs from localStorage:', e);
    return {};
  }
};

/**
 * Save all logs to localStorage.
 * @param {Object} logs - The logs object to save
 */
const saveLogs = (logs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save lesson logs to localStorage:', e);
  }
};

/**
 * Get logs for a specific roster (lesson).
 * @param {number|string} rosterId - The roster/lesson ID
 * @returns {Array} - Array of log entries for this lesson, sorted by date (newest first)
 */
export const getLogsForRoster = (rosterId) => {
  const allLogs = getAllLogs();
  const rosterLogs = [];

  for (const [key, log] of Object.entries(allLogs)) {
    if (key.startsWith(`${rosterId}_`)) {
      rosterLogs.push(log);
    }
  }

  // Sort by date, newest first
  return rosterLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
};

/**
 * Get log for a specific roster on a specific date.
 * @param {number|string} rosterId - The roster/lesson ID
 * @param {string} dateKey - The date in YYYY-MM-DD format
 * @returns {Object|null} - The log entry or null if not found
 */
export const getLogForDate = (rosterId, dateKey) => {
  const allLogs = getAllLogs();
  const key = getLogKey(rosterId, dateKey);
  return allLogs[key] || null;
};

/**
 * Log types for lesson logs.
 */
export const LOG_TYPES = {
  LES: 'les',
  QURAN: 'quran',
};

/**
 * Add or update a log entry.
 * @param {number|string} rosterId - The roster/lesson ID
 * @param {string} dateKey - The date in YYYY-MM-DD format
 * @param {string} content - The log content/note
 * @param {Object} metadata - Additional metadata (teacherId, teacherName, type, etc.)
 * @returns {Object} - The saved log entry
 */
export const saveLog = (rosterId, dateKey, content, metadata = {}) => {
  const allLogs = getAllLogs();
  const key = getLogKey(rosterId, dateKey);

  const existingLog = allLogs[key];
  const now = new Date().toISOString();

  const logEntry = {
    rosterId,
    date: dateKey,
    content,
    type: metadata.type || LOG_TYPES.LES,
    teacherId: metadata.teacherId,
    teacherName: metadata.teacherName,
    createdAt: existingLog?.createdAt || now,
    updatedAt: now,
  };

  allLogs[key] = logEntry;
  saveLogs(allLogs);

  return logEntry;
};

/**
 * Delete a log entry.
 * @param {number|string} rosterId - The roster/lesson ID
 * @param {string} dateKey - The date in YYYY-MM-DD format
 */
export const deleteLog = (rosterId, dateKey) => {
  const allLogs = getAllLogs();
  const key = getLogKey(rosterId, dateKey);

  if (allLogs[key]) {
    delete allLogs[key];
    saveLogs(allLogs);
  }
};

/**
 * Delete all logs for a roster (e.g., when a lesson is deleted).
 * @param {number|string} rosterId - The roster/lesson ID
 */
export const deleteLogsForRoster = (rosterId) => {
  const allLogs = getAllLogs();
  const keysToDelete = Object.keys(allLogs).filter((key) =>
    key.startsWith(`${rosterId}_`)
  );

  keysToDelete.forEach((key) => delete allLogs[key]);
  saveLogs(allLogs);
};

const lessonLogStorage = {
  getAllLogs,
  getLogsForRoster,
  getLogForDate,
  saveLog,
  deleteLog,
  deleteLogsForRoster,
  LOG_TYPES,
};

export default lessonLogStorage;
