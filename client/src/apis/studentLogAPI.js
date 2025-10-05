import RequestHandler from './RequestHandler';

const BASE = '/general/student-logs';

async function get_logs() {
  const res = await RequestHandler.get(BASE);
  return res?.data ?? [];
}

async function create_log(payload) {
  const res = await RequestHandler.post(BASE, payload);
  return res?.data;
}

async function update_log(id, payload) {
  const res = await RequestHandler.put(`${BASE}/${id}`, payload);
  return res?.data;
}

async function delete_log(id) {
  const res = await RequestHandler.del(`${BASE}/${id}`);
  return res?.data;
}

export default { get_logs, create_log, update_log, delete_log };

