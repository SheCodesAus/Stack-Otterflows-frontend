import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchNotificationSummary } from "../api/notifications";
import {
  EMPTY_NOTIFICATION_SUMMARY,
  NotificationContext,
} from "./NotificationContext";

function hasToken() {
  return Boolean(localStorage.getItem("token"));
}

export function NotificationProvider({ children }) {
  const location = useLocation();

  const [summary, setSummary] = useState(EMPTY_NOTIFICATION_SUMMARY);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [version, setVersion] = useState(0);

  const latestRequestId = useRef(0);

  const refreshNotificationSummary = useCallback(async () => {
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;

    if (!hasToken()) {
      setSummary(EMPTY_NOTIFICATION_SUMMARY);
      return;
    }

    try {
      setLoadingSummary(true);
      const data = await fetchNotificationSummary();

      if (latestRequestId.current !== requestId) {
        return;
      }

      setSummary({
        unread_count: Number(data?.unread_count) || 0,
        needs_review_count: Number(data?.needs_review_count) || 0,
        all_count: Number(data?.all_count) || 0,
      });
    } catch (error) {
      if (latestRequestId.current === requestId) {
        console.error("Failed to refresh notification summary:", error);
      }
    } finally {
      if (latestRequestId.current === requestId) {
        setLoadingSummary(false);
      }
    }
  }, []);

  const signalNotificationChange = useCallback(async () => {
    await refreshNotificationSummary();
    setVersion((value) => value + 1);
  }, [refreshNotificationSummary]);

  const clearNotifications = useCallback(() => {
    latestRequestId.current += 1;
    setSummary(EMPTY_NOTIFICATION_SUMMARY);
    setVersion((value) => value + 1);
  }, []);

  useEffect(() => {
    refreshNotificationSummary();
  }, [refreshNotificationSummary, location.pathname]);

  useEffect(() => {
    if (!hasToken()) return undefined;

    function handleFocus() {
      refreshNotificationSummary();
    }

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refreshNotificationSummary]);

  useEffect(() => {
    if (!hasToken()) return undefined;

    const intervalId = window.setInterval(() => {
      refreshNotificationSummary();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [refreshNotificationSummary]);

  const value = useMemo(
    () => ({
      summary,
      loadingSummary,
      version,
      refreshNotificationSummary,
      signalNotificationChange,
      clearNotifications,
    }),
    [
      summary,
      loadingSummary,
      version,
      refreshNotificationSummary,
      signalNotificationChange,
      clearNotifications,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}