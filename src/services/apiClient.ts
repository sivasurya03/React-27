import axios from 'axios';

/**
 * Shared Axios instance. The mock services in this folder do not call it yet; when a real backend exists,
 * swap each service body for `apiClient.get/post(...)` and the UI keeps working unchanged.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  try {
    const raw = window.localStorage.getItem('lms:session');
    const token = raw ? (JSON.parse(raw) as { token?: string }).token : undefined;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // Ignore unreadable session data.
  }
  return config;
});
