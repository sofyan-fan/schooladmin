import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || '/api';

const connection = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 15000,
});

export default connection;
