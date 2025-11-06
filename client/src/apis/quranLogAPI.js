import RequestHandler from './RequestHandler';

// Quran log endpoints currently reuse the student logs backend
// mounted under /api/general/student-logs
const BASE = '/general/student-logs';

export async function get_logs() {
  const res = await RequestHandler.get(BASE);
  return res?.data ?? [];
}

export async function create_log(payload) {
  const res = await RequestHandler.post(BASE, payload);
  return res?.data;
}

export async function update_log(id, payload) {
  const res = await RequestHandler.put(`${BASE}/${id}`, payload);
  return res?.data;
}

export async function delete_log(id) {
  const res = await RequestHandler.del(`${BASE}/${id}`);
  return res?.data;
}

const quranLogAPI = { get_logs, create_log, update_log, delete_log };

export default quranLogAPI;


