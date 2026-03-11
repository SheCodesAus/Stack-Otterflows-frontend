import { authFetch } from "./auth-fetch";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const NOTIFICATIONS_LIST_URL = `${API_BASE_URL}/notifications/`;
const NOTIFICATIONS_SUMMARY_URL = `${API_BASE_URL}/notifications/summary/`;
const NOTIFICATIONS_MARK_ALL_READ_URL = `${API_BASE_URL}/notifications/read-all/`;

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
  const response = await authFetch(NOTIFICATIONS_SUMMARY_URL);
  return parseJson(response);
}

export async function fetchNotifications({ tab = "all", limit = 8 } = {}) {
  const url = new URL(NOTIFICATIONS_LIST_URL, window.location.origin);

  url.searchParams.set("tab", tab);

  if (limit) {
    url.searchParams.set("limit", String(limit));
  }

  const response = await authFetch(url.pathname + url.search);
  return parseJson(response);
}

export async function markNotificationRead(notificationId) {
  const response = await authFetch(
    `${API_BASE_URL}/notifications/${notificationId}/read/`,
    {
      method: "POST",
    }
  );

  return parseJson(response);
}

export async function markNotificationUnread(notificationId) {
  const response = await authFetch(
    `${API_BASE_URL}/notifications/${notificationId}/unread/`,
    {
      method: "POST",
    }
  );

  return parseJson(response);
}

export async function resolveNotification(notificationId) {
  const response = await authFetch(
    `${API_BASE_URL}/notifications/${notificationId}/resolve/`,
    {
      method: "POST",
    }
  );

  return parseJson(response);
}

export async function markAllNotificationsRead(tab = "all") {
  const response = await authFetch(NOTIFICATIONS_MARK_ALL_READ_URL, {
    method: "POST",
    body: JSON.stringify({ tab }),
  });

  return parseJson(response);
}