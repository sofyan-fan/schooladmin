import axios from 'axios';

// When VITE_USE_JSON_SERVER === 'true' we target the mock (json-server) on 8000.
// Otherwise we target the real backend on 3000.
const useJsonServer = import.meta.env.VITE_USE_JSON_SERVER === 'true';

const connection = axios.create({
  baseURL: useJsonServer ? 'http://localhost:8000' : 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default connection;
