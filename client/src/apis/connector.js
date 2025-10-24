import axios from 'axios';

/**
 * Use a relative base so it works everywhere:
 * - Local dev: Vite proxies /api → http://localhost:3000 (and strips /api)
 * - Netlify:   _redirects proxies /api → http://85.215.181.159 (and strips /api)
 *
 * Optional: allow an override for local experiments by setting VITE_API_BASE_URL,
 * but DO NOT set that env var on Netlify (to avoid HTTPS→HTTP mixed-content).
 */
// const baseURL =
//   import.meta.env.VITE_API_BASE_URL?.trim() || '/api';
const baseURL = 'http://localhost:3000/';
const connection = axios.create({
  baseURL, // << key: '/api' in prod, optional override in local
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 15000,
});

export default connection;
