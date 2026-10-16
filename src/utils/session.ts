// Where the login token is kept. "Remember me" uses localStorage (survives closing the browser);
// otherwise sessionStorage (cleared when the browser closes).

const KEY = 'token';

const safely = <T>(action: () => T, fallback: T): T => {
  try {
    return action();
  } catch {
    return fallback; // Storage blocked (e.g. some private modes)
  }
};

export const getToken = () =>
  safely(() => localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY), null);

export const saveToken = (token: string, remember: boolean) =>
  safely(() => {
    clearToken();
    (remember ? localStorage : sessionStorage).setItem(KEY, token);
  }, undefined);

export const clearToken = () =>
  safely(() => {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
  }, undefined);
