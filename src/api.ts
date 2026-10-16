import axios from 'axios';
import { API_URL } from './config.ts';
import { getToken } from './utils/session.ts';

// Connect to your Express backend. No fixed Content-Type: axios picks JSON for objects
// and multipart/form-data for FormData (product image uploads).
export const api = axios.create({
  baseURL: API_URL,
});

// Add a request interceptor to attach the token
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If a logged-in request comes back 401, the token has expired: tell the app to log out
api.interceptors.response.use(undefined, (error) => {
  if (error.response?.status === 401 && error.config?.headers?.Authorization) {
    window.dispatchEvent(new Event('auth:expired'));
  }
  return Promise.reject(error);
});

// The message to show for a failed request: the API's own message when there is one
export const getErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.') => {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Cannot reach the server. Is the backend running?';
    return error.response.data?.message || fallback;
  }
  return error instanceof Error ? error.message : fallback; // e.g. guest cart stock checks
};

// Field-by-field validation errors from the API, keyed by field name ("shippingAddress.city" -> "city" with a prefix)
export const getFieldErrors = (error: unknown, prefix = ''): Record<string, string> => {
  if (!axios.isAxiosError(error) || !Array.isArray(error.response?.data?.errors)) return {};
  const errors: Record<string, string> = {};
  for (const { field, message } of error.response.data.errors as { field: string; message: string }[]) {
    errors[prefix && field.startsWith(prefix) ? field.slice(prefix.length) : field] = message;
  }
  return errors;
};
