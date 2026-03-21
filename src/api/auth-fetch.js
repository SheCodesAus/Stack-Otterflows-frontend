import { getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL;

function buildUrl(path = "") {
  const base = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
  return `${base}api/${path.replace(/^\//, "")}`;
}

export async function authFetch(path, options = {}) {
  const token = getToken();

  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  const isFormData = options.body instanceof FormData;

  if (options.body && !isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Token ${token}`;
  }

  return fetch(buildUrl(path), {
    ...options,
    headers,
  });
}

export { buildUrl };