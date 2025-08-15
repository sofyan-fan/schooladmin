import axios from 'axios';

const useJsonServer = import.meta.env.VITE_USE_JSON_SERVER === 'true';
const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (useJsonServer ? 'http://localhost:8000' : 'http://localhost:3000');

const connection = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default connection;
