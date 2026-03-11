import { authFetch } from "./auth-fetch";

async function parseJson(response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      "Dashboard request failed.";
    throw new Error(message);
  }

  return data;
}

export async function fetchGoals() {
  const response = await authFetch("goals/");
  return parseJson(response);
}

export async function fetchGoalDetail(goalId) {
  const response = await authFetch(`goals/${goalId}/`);
  return parseJson(response);
}

export async function fetchPods() {
  const response = await authFetch("pods/");
  return parseJson(response);
}

export async function fetchPodDetail(podId) {
  const response = await authFetch(`pods/${podId}/`);
  return parseJson(response);
}