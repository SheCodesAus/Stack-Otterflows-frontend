import { authFetch } from "./auth-fetch";

export default async function getCurrentUser() {
  const res = await authFetch("me/");
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.detail || "Not authenticated");
  }

  return data;
}