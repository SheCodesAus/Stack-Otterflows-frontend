const TOKEN_KEY = "token";
const AUTH_EVENT = "auth-changed";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function hasToken() {
  return !!getToken();
}

export function getAuthEventName() {
  return AUTH_EVENT;
}