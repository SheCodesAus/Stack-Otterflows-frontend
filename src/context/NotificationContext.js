import { createContext } from "react";

export const NotificationContext = createContext(null);

export const EMPTY_NOTIFICATION_SUMMARY = {
  unread_count: 0,
  needs_review_count: 0,
  all_count: 0,
};