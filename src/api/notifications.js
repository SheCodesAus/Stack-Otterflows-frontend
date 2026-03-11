import { authFetch } from "./auth-fetch";

async function parseJson(response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      "Notification request failed.";
    throw new Error(message);
  }

  return data;
}

export async function fetchNotificationSummary() {
  const response = await authFetch("notifications/summary/");
  return parseJson(response);
}

export async function fetchNotifications({ tab = "all", limit = 8 } = {}) {
  const params = new URLSearchParams();
  params.set("tab", tab);

  if (limit) {
    params.set("limit", String(limit));
  }

  const response = await authFetch(`notifications/?${params.toString()}`);
  return parseJson(response);
}

export async function markNotificationRead(notificationId) {
  const response = await authFetch(`notifications/${notificationId}/read/`, {
    method: "POST",
  });

  return parseJson(response);
}

export async function markNotificationUnread(notificationId) {
  const response = await authFetch(`notifications/${notificationId}/unread/`, {
    method: "POST",
  });

  return parseJson(response);
}

export async function resolveNotification(notificationId) {
  const response = await authFetch(`notifications/${notificationId}/resolve/`, {
    method: "POST",
  });

  return parseJson(response);
}

export async function markAllNotificationsRead(tab = "all") {
  const response = await authFetch("notifications/read-all/", {
    method: "POST",
    body: JSON.stringify({ tab }),
  });

  return parseJson(response);
}