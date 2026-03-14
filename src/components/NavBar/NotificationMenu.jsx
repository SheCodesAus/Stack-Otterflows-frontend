import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../../api/auth-fetch";
import {
  fetchNotificationSummary,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  resolveNotification,
} from "../../api/notifications";

const TAB_OPTIONS = [
  { key: "needs_review", label: "Needs review" },
  { key: "unread", label: "Unread" },
  { key: "all", label: "All" },
];

function getTabCount(summary, tabKey) {
  if (!summary) return 0;

  if (tabKey === "needs_review") return summary.needs_review_count || 0;
  if (tabKey === "unread") return summary.unread_count || 0;
  return summary.all_count || 0;
}

function getNotificationTone(notification) {
  if (notification.is_needs_review) return "needs-review";
  if (!notification.is_read) return "unread";
  return "default";
}

function isGoalAssignmentRequest(notification) {
  return notification.notif_type === "GOAL_ASSIGNMENT_REQUEST";
}

function getAssignmentId(notification) {
  return (
    notification.assignment_id ||
    notification.payload_json?.assignment_id ||
    null
  );
}

export default function NotificationMenu({ open, onClose, onSummaryRefresh }) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("needs_review");
  const [summary, setSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");

  async function loadSummary() {
    setLoadingSummary(true);

    try {
      const data = await fetchNotificationSummary();
      setSummary(data);

      setActiveTab((currentTab) => {
        if (currentTab === "needs_review" && data.needs_review_count > 0) {
          return currentTab;
        }

        if (currentTab === "unread" && data.unread_count > 0) {
          return currentTab;
        }

        if (data.needs_review_count > 0) return "needs_review";
        if (data.unread_count > 0) return "unread";
        return "all";
      });
    } catch (err) {
      setError(err.message || "Could not load notification summary.");
    } finally {
      setLoadingSummary(false);
    }
  }

  async function loadNotifications(tabToLoad) {
    setLoadingList(true);
    setError("");

    try {
      const data = await fetchNotifications({ tab: tabToLoad, limit: 8 });
      setNotifications(data);
    } catch (err) {
      setError(err.message || "Could not load notifications.");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    loadSummary();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    loadNotifications(activeTab);
  }, [open, activeTab]);

async function refreshCurrentView() {
  await Promise.all([loadSummary(), loadNotifications(activeTab)]);
  if (onSummaryRefresh) {
    await onSummaryRefresh();
  }
}

  async function handleNotificationClick(notification) {
    try {
      setError("");

      if (!notification.is_read) {
        setBusyId(notification.id);
        await markNotificationRead(notification.id);
      }

      if (isGoalAssignmentRequest(notification)) {
        await refreshCurrentView();
        return;
      }

      onClose();
      navigate(notification.target_url || "/dashboard");
    } catch (err) {
      setError(err.message || "Could not open notification.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleResolve(event, notificationId) {
    event.stopPropagation();

    try {
      setBusyId(notificationId);
      await resolveNotification(notificationId);
      await refreshCurrentView();
    } catch (err) {
      setError(err.message || "Could not resolve notification.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkAllRead() {
    try {
      setMarkingAll(true);
      await markAllNotificationsRead(activeTab);
      await refreshCurrentView();
    } catch (err) {
      setError(err.message || "Could not mark notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleAssignmentResponse(event, notification, action) {
    event.stopPropagation();

    const assignmentId = getAssignmentId(notification);

    if (!assignmentId) {
      setError("This buddy request is missing an assignment ID.");
      return;
    }

    try {
      setBusyId(notification.id);
      setError("");

      const endpoint =
        action === "accept"
          ? `goal-assignments/${assignmentId}/accept/`
          : `goal-assignments/${assignmentId}/decline/`;

      const response = await authFetch(endpoint, {
        method: "POST",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            `Could not ${action === "accept" ? "accept" : "decline"} buddy request.`
        );
      }

      if (!notification.is_read) {
        await markNotificationRead(notification.id);
      }

      await refreshCurrentView();
    } catch (err) {
      setError(
        err.message ||
          `Could not ${action === "accept" ? "accept" : "decline"} buddy request.`
      );
    } finally {
      setBusyId(null);
    }
  }

  const hasUnread = useMemo(() => (summary?.unread_count || 0) > 0, [summary]);

  return (
    <div className="nav-dropdown nav-dropdown--notifications">
      <div className="nav-dropdown__header nav-dropdown__header--notifications">
        <div>
          <strong>Notifications</strong>
          <p className="nav-dropdown__subtext">
            {loadingSummary
              ? "Loading summary..."
              : `${summary?.unread_count || 0} unread • ${
                  summary?.needs_review_count || 0
                } needs review`}
          </p>
        </div>

        <button
          type="button"
          className="nav-dropdown__ghost-action"
          onClick={handleMarkAllRead}
          disabled={markingAll || !hasUnread}
        >
          {markingAll ? "Marking..." : "Mark all read"}
        </button>
      </div>

      <div className="notification-tabs" role="tablist" aria-label="Notification tabs">
        {TAB_OPTIONS.map((tab) => {
          const count = getTabCount(summary, tab.key);
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              className={`notification-tab ${isActive ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.label}</span>
              <span className="notification-tab__count">{count}</span>
            </button>
          );
        })}
      </div>

      {error ? <p className="nav-dropdown__error">{error}</p> : null}

      <div className="nav-dropdown__list nav-dropdown__list--notifications">
        {loadingList ? (
          <p className="nav-dropdown__empty">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="nav-dropdown__empty">Nothing here right now.</p>
        ) : (
          notifications.map((notification) => {
            const tone = getNotificationTone(notification);
            const isBuddyRequest = isGoalAssignmentRequest(notification);
            const assignmentId = getAssignmentId(notification);
            const showBuddyActions =
  isBuddyRequest && !!assignmentId && !notification.is_resolved;
            const isBusy = busyId === notification.id;

            return (
              <article
                key={notification.id}
                className={`notification-card notification-card--${tone}`}
              >
                {isBuddyRequest ? (
                  <div className="notification-card__main notification-card__main--static">
                    <div className="notification-card__top">
                      <div className="notification-card__heading">
                        {!notification.is_read && (
                          <span
                            className="notification-card__unread-dot"
                            aria-hidden="true"
                          />
                        )}

                        <span className="notification-card__title">
                          {notification.title}
                        </span>
                      </div>

                      {notification.is_needs_review && (
                        <span className="notification-card__pill">Needs review</span>
                      )}
                    </div>

                    <p className="notification-card__message">{notification.message}</p>

                    <p className="notification-card__helper">
  {showBuddyActions
    ? "Choose Accept or Decline below."
    : notification.is_resolved
    ? "This buddy request has already been handled."
    : "This buddy request is missing its assignment link."}
</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="notification-card__main"
                    onClick={() => handleNotificationClick(notification)}
                    disabled={isBusy}
                  >
                    <div className="notification-card__top">
                      <div className="notification-card__heading">
                        {!notification.is_read && (
                          <span
                            className="notification-card__unread-dot"
                            aria-hidden="true"
                          />
                        )}

                        <span className="notification-card__title">
                          {notification.title}
                        </span>
                      </div>

                      {notification.is_needs_review && (
                        <span className="notification-card__pill">Needs review</span>
                      )}
                    </div>

                    <p className="notification-card__message">{notification.message}</p>
                  </button>
                )}

                <div className="notification-card__footer">
                  <span className="notification-card__type">
                    {notification.type_label}
                  </span>

                  {showBuddyActions ? (
                    <div className="notification-card__actions">
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={(event) =>
                          handleAssignmentResponse(event, notification, "decline")
                        }
                        disabled={isBusy}
                      >
                        {isBusy ? "Working..." : "Decline"}
                      </button>

                      <button
                        type="button"
                        className="btn primary"
                        onClick={(event) =>
                          handleAssignmentResponse(event, notification, "accept")
                        }
                        disabled={isBusy}
                      >
                        {isBusy ? "Working..." : "Accept"}
                      </button>
                    </div>
                  ) : notification.is_action_required && !notification.is_resolved ? (
                    <button
                      type="button"
                      className="notification-card__resolve"
                      onClick={(event) => handleResolve(event, notification.id)}
                      disabled={isBusy}
                    >
                      Resolve
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}