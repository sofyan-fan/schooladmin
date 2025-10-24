import axios from 'axios';

/**
 * Default to a relative base so it works across LAN/dev/prod without CORS:
 * - Dev: Vite proxies /api → http://localhost:3000 (and strips /api)
 * - Prod: Netlify/_redirects (or reverse proxy) maps /api → backend
 *
 * You can override via VITE_API_BASE_URL for special cases.
 */
const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || '/api';

const connection = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 15000,
});

export default connection;
