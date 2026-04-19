import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../../api/auth-fetch";
import {
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

function isPodInviteRequest(notification) {
  return notification.notif_type === "POD_INVITE";
}

function getAssignmentId(notification) {
  return (
    notification.assignment_id ||
    notification.payload_json?.assignment_id ||
    null
  );
}

function getMembershipId(notification) {
  return (
    notification.membership_id ||
    notification.payload_json?.membership_id ||
    null
  );
}

function getPodId(notification) {
  return notification.pod_id || notification.payload_json?.pod_id || null;
}

export default function NotificationMenu({
  open,
  onClose,
  summary,
  onSummaryRefresh,
  onNotificationsChanged,
  notificationsVersion,
}) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("needs_review");
  const [notifications, setNotifications] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");

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
  if (!summary) return;

  setActiveTab((currentTab) => {
    const currentCount = getTabCount(summary, currentTab);

    if (currentCount > 0) {
      return currentTab;
    }

    if (summary.needs_review_count > 0) return "needs_review";
    if (summary.unread_count > 0) return "unread";
    return "all";
  });
}, [summary]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadMenuState() {
      try {
        if (onSummaryRefresh) {
          await onSummaryRefresh();
        }

        if (!cancelled) {
          await loadNotifications(activeTab);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load notifications.");
        }
      }
    }

    loadMenuState();

    return () => {
      cancelled = true;
    };
  }, [open, activeTab, notificationsVersion, onSummaryRefresh]);

  async function refreshCurrentView() {
    if (onNotificationsChanged) {
      await onNotificationsChanged();
    } else if (onSummaryRefresh) {
      await onSummaryRefresh();
    }

    await loadNotifications(activeTab);
  }

  async function handleNotificationClick(notification) {
    try {
      setError("");

      const isActionCard =
        isGoalAssignmentRequest(notification) || isPodInviteRequest(notification);

      if (!notification.is_read) {
        setBusyId(notification.id);
        await markNotificationRead(notification.id);

        if (onNotificationsChanged) {
          await onNotificationsChanged();
        } else if (onSummaryRefresh) {
          await onSummaryRefresh();
        }
      }

      if (isActionCard) {
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

  async function handlePodInviteResponse(event, notification, action) {
    event.stopPropagation();

    const membershipId = getMembershipId(notification);
    const podId = getPodId(notification);

    if (!membershipId) {
      setError("This pod invite is missing a membership ID.");
      return;
    }

    try {
      setBusyId(notification.id);
      setError("");

      const endpoint =
        action === "accept"
          ? `pod-memberships/${membershipId}/accept/`
          : `pod-memberships/${membershipId}/decline/`;

      const response = await authFetch(endpoint, {
        method: "POST",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            `Could not ${action === "accept" ? "accept" : "decline"} pod invite.`
        );
      }

      if (!notification.is_read) {
        await markNotificationRead(notification.id);
      }

      await refreshCurrentView();

      if (action === "accept" && podId) {
        onClose();
        navigate(`/pods/${podId}`);
      }
    } catch (err) {
      setError(
        err.message ||
          `Could not ${action === "accept" ? "accept" : "decline"} pod invite.`
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
            {`${summary?.unread_count || 0} unread • ${
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
            const isPodInvite = isPodInviteRequest(notification);

            const assignmentId = getAssignmentId(notification);
            const membershipId = getMembershipId(notification);

            const showBuddyActions =
              isBuddyRequest && !!assignmentId && !notification.is_resolved;

            const showPodInviteActions =
              isPodInvite && !!membershipId && !notification.is_resolved;

            const isStaticActionCard = showBuddyActions || showPodInviteActions;
            const isBusy = busyId === notification.id;

            return (
              <article
                key={notification.id}
                className={`notification-card notification-card--${tone}`}
              >
                {isStaticActionCard ? (
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
                        : showPodInviteActions
                        ? "Choose Accept or Decline below."
                        : notification.is_resolved
                        ? "This notification has already been handled."
                        : "This notification is missing its action link."}
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
                  ) : showPodInviteActions ? (
                    <div className="notification-card__actions">
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={(event) =>
                          handlePodInviteResponse(event, notification, "decline")
                        }
                        disabled={isBusy}
                      >
                        {isBusy ? "Working..." : "Decline"}
                      </button>

                      <button
                        type="button"
                        className="btn primary"
                        onClick={(event) =>
                          handlePodInviteResponse(event, notification, "accept")
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