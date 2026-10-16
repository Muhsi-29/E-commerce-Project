// Backend API address. Set VITE_API_URL (in .env, or at build time) when the API lives elsewhere.
export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';

// The separate admin panel website (linked from the account menu for admins)
export const ADMIN_URL: string = import.meta.env.VITE_ADMIN_URL ?? 'http://localhost:5174';

const BACKEND_ORIGIN = new URL(API_URL).origin;

// Uploaded images are stored as "/uploads/..." on the backend; other images are already full URLs
export const imageUrl = (path: string) => (/^https?:\/\//.test(path) ? path : `${BACKEND_ORIGIN}${path}`);
