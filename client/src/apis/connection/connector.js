import axios from 'axios';

const useJsonServer = import.meta.env.VITE_USE_JSON_SERVER === 'false';

const connection = axios.create({
  baseURL: useJsonServer ? 'http://localhost:8000' : 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default connection;
