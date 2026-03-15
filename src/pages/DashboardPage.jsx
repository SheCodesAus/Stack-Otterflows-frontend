import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { authFetch } from "../api/auth-fetch";
import getCurrentUser from "../api/getCurrentUser";
import { fetchNotifications } from "../api/notifications";
import {
  fetchGoals,
  fetchGoalDetail,
  fetchPods,
  fetchPodDetail,
} from "../api/dashboard";
import "./DashboardPage.css";

const categoryMap = {
  HEALTH: { label: "Health", icon: "🫀" },
  EDUCATION: { label: "Education", icon: "📚" },
  FITNESS: { label: "Fitness", icon: "💪" },
  CAREER: { label: "Career", icon: "💼" },
  CREATIVE: { label: "Creative", icon: "🎨" },
  WELLBEING: { label: "Wellbeing", icon: "🌿" },
  OTHER: { label: "Other", icon: "✨" },
};

function humanizeEnum(value) {
  if (!value) return "";
  return value
    .toString()
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getCheckInStatusClass(status) {
  switch (status) {
    case "Approved":
      return "dashboard-goal-meta__value--approved";
    case "Pending":
      return "dashboard-goal-meta__value--pending";
    case "Rejected":
      return "dashboard-goal-meta__value--rejected";
    case "No check-ins yet":
      return "dashboard-goal-meta__value--empty";
    default:
      return "";
  }
}

function getBuddyStatusClass(status) {
  switch (status) {
    case "Accepted":
      return "dashboard-goal-meta__value--accepted";
    case "Pending":
      return "dashboard-goal-meta__value--pending";
    case "Declined":
      return "dashboard-goal-meta__value--rejected";
    case "Not assigned":
      return "dashboard-goal-meta__value--empty";
    default:
      return "";
  }
}

function formatBuddyLabel(name, status) {
  const cleanName = name?.trim();
  const cleanStatus = humanizeEnum(status);

  if (status === "Not assigned") return "Not assigned";
  if (status === "Accepted") return cleanName || "Accepted";

  if (cleanName && cleanStatus) {
    return `${cleanName} (${cleanStatus})`;
  }

  return cleanName || cleanStatus || "Pending";
}

function formatReviewCount(count) {
  if (count === 1) return "1 pending review";
  return `${count} pending reviews`;
}

function isCheckInReviewNotification(notification) {
  const type = notification?.notif_type || "";
  const typeLabel = (notification?.type_label || "").toLowerCase();
  const title = (notification?.title || "").toLowerCase();

  return (
    type.includes("CHECKIN") ||
    typeLabel.includes("check-in") ||
    typeLabel.includes("check in") ||
    title.includes("check-in") ||
    title.includes("check in")
  );
}

function getReviewFallbackUrl(notification) {
  if (notification?.target_url) return notification.target_url;

  if ((notification?.notif_type || "").startsWith("POD_")) {
    return "/pods";
  }

  return "/goals";
}

function normaliseGoal(baseGoal, detailGoal) {
  const assignments = detailGoal?.assignments || [];
  const firstAssignment = assignments[0];

  const buddyName =
    firstAssignment?.buddy_display_name ||
    firstAssignment?.buddy_username ||
    "";

  const buddyStatus = firstAssignment?.consent_status
    ? humanizeEnum(firstAssignment.consent_status)
    : "Not assigned";

  const latestCheckInStatus = detailGoal?.latest_checkin_status
    ? humanizeEnum(detailGoal.latest_checkin_status)
    : "No check-ins yet";

  return {
    id: baseGoal.id,
    title: baseGoal.title,
    category: baseGoal.category,
    status: baseGoal.status,
    motivation: baseGoal.motivation,
    latestCheckInStatus,
    buddyName,
    buddyStatus,
  };
}

function normaliseSupportedGoal(detailGoal) {
  const latestCheckInStatus = detailGoal?.latest_checkin_status
    ? humanizeEnum(detailGoal.latest_checkin_status)
    : "No check-ins yet";

  return {
    id: detailGoal.id,
    title: detailGoal.title,
    category: detailGoal.category,
    motivation: detailGoal.motivation,
    ownerName:
      detailGoal.owner_display_name ||
      detailGoal.owner_username ||
      "Unknown",
    latestCheckInStatus,
  };
}

function normalisePod(basePod, detailPod) {
  const podGoals = detailPod?.pod_goals || [];
  const activePodGoalsCount = podGoals.filter(
    (goal) => goal.status === "ACTIVE"
  ).length;

  return {
    id: basePod.id,
    name: basePod.name,
    summary: basePod.description || "No description yet.",
    isActive: basePod.is_active,
    activePodGoalsCount,
    memberCount: (detailPod?.memberships || []).length,
  };
}

function normaliseReviewItem(notification) {
  const label = notification?.type_label || "Pending review";

  return {
    id: notification.id,
    label,
    title: notification.title || "Review required",
    description:
      notification.message || "A check-in is waiting for your review.",
    actionLabel: "Open Review",
    actionTo: getReviewFallbackUrl(notification),
  };
}

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [goals, setGoals] = useState([]);
  const [supportedGoals, setSupportedGoals] = useState([]);
  const [pods, setPods] = useState([]);
  const [reviewItems, setReviewItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [
          currentUser,
          goalsList,
          podsList,
          needsReviewNotifications,
          assignmentsResponse,
        ] = await Promise.all([
          getCurrentUser(),
          fetchGoals(),
          fetchPods(),
          fetchNotifications({ tab: "needs_review", limit: 50 }),
          authFetch("goal-assignments/"),
        ]);

        const assignmentsData = await assignmentsResponse.json().catch(() => ({}));

        if (!assignmentsResponse.ok) {
          throw new Error(
            assignmentsData?.detail ||
              `Failed to load supported goals (${assignmentsResponse.status})`
          );
        }

        setUser(currentUser);

        const goalDetails = await Promise.all(
          goalsList.map((goal) => fetchGoalDetail(goal.id))
        );

        const podDetails = await Promise.all(
          podsList.map((pod) => fetchPodDetail(pod.id))
        );

        const realGoals = goalsList.map((goal) => {
          const matchingDetail = goalDetails.find((detail) => detail.id === goal.id);
          return normaliseGoal(goal, matchingDetail);
        });

        const realPods = podsList.map((pod) => {
          const matchingDetail = podDetails.find((detail) => detail.id === pod.id);
          return normalisePod(pod, matchingDetail);
        });

        const reviewNotifications = Array.isArray(needsReviewNotifications)
          ? needsReviewNotifications
          : [];

        const realReviewItems = reviewNotifications
          .filter(isCheckInReviewNotification)
          .map(normaliseReviewItem);

        const assignments = Array.isArray(assignmentsData) ? assignmentsData : [];
        const acceptedAssignments = assignments.filter(
          (assignment) => assignment.consent_status === "ACCEPTED"
        );

        const uniqueSupportedGoalIds = [
          ...new Set(acceptedAssignments.map((assignment) => assignment.goal)),
        ];

        const supportedGoalDetails = await Promise.all(
          uniqueSupportedGoalIds.map(async (goalId) => {
            try {
              return await fetchGoalDetail(goalId);
            } catch {
              return null;
            }
          })
        );

        const realSupportedGoals = supportedGoalDetails
          .filter(Boolean)
          .map(normaliseSupportedGoal);

        setGoals(realGoals);
        setSupportedGoals(realSupportedGoals);
        setPods(realPods);
        setReviewItems(realReviewItems);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError(err.message || "Could not load your dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const welcomeName =
    user?.display_name?.trim() || user?.username?.trim() || "";

  const visibleGoals = useMemo(() => goals.slice(0, 3), [goals]);
  const visibleSupportedGoals = useMemo(
    () => supportedGoals.slice(0, 3),
    [supportedGoals]
  );
  const visiblePods = useMemo(() => pods.slice(0, 3), [pods]);
  const visibleReviewItems = useMemo(() => reviewItems.slice(0, 3), [reviewItems]);

  const activeGoalsCount = useMemo(
    () => goals.filter((goal) => goal.status === "ACTIVE").length,
    [goals]
  );

  const reviewCount = reviewItems.length;

  const activePodsCount = useMemo(
    () => pods.filter((pod) => pod.isActive).length,
    [pods]
  );

  const supportedGoalsCount = supportedGoals.length;

  return (
    <section className="page-shell dashboard-page">
      <section className="dashboard-intro-panel">
        <header className="dashboard-hero">
          <h1>{welcomeName ? `Welcome back, ${welcomeName}` : "Welcome back"}</h1>
          <p>Here’s your accountability snapshot for this week.</p>
        </header>
      </section>

      {error ? (
        <section className="dashboard-panel">
          <p className="dashboard-state dashboard-state--error">{error}</p>
        </section>
      ) : null}

      <section
        id="dashboard-quick-actions"
        className="dashboard-panel dashboard-panel--quick-actions"
      >
        <div className="dashboard-panel__header">
          <h2>Quick Actions</h2>
        </div>

        <div className="dashboard-actions">
          <Link to="/goals/new" className="btn primary">
            Create Goal
          </Link>

          <Link to="/pods/new" className="btn primary">
            Create Pod
          </Link>

          <Link to="/connections" className="btn primary">
            Invite Buddy
          </Link>
        </div>
      </section>

      <section className="dashboard-panel">
        <h2>Weekly Snapshot</h2>

        <div className="dashboard-stats">
          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Active goals</span>
            <strong>{loading ? "…" : activeGoalsCount}</strong>
          </div>

          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Needs my review</span>
            <strong>{loading ? "…" : reviewCount}</strong>
          </div>

          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Goals I’m supporting</span>
            <strong>{loading ? "…" : supportedGoalsCount}</strong>
          </div>

          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Active pods</span>
            <strong>{loading ? "…" : activePodsCount}</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>My Goals</h2>
          <Link to="/goals" className="btn link">
            View all ({goals.length})
          </Link>
        </div>

        {loading ? (
          <p className="dashboard-state">Loading goals...</p>
        ) : visibleGoals.length === 0 ? (
          <p className="dashboard-state">
            No goals yet. Create your first goal to get started.
          </p>
        ) : (
          <div className="dashboard-list">
            {visibleGoals.map((goal) => {
              const category = categoryMap[goal.category] || categoryMap.OTHER;

              return (
                <article key={goal.id} className="dashboard-row">
                  <div className="dashboard-row__content">
                    <h3 className="dashboard-goal-title">{goal.title}</h3>

                    <div className="dashboard-goal-meta">
                      <span className="dashboard-goal-meta__item dashboard-goal-meta__item--category">
                        <span className="dashboard-goal-meta__icon" aria-hidden="true">
                          {category.icon}
                        </span>
                        <span>{category.label}</span>
                      </span>

                      <span className="dashboard-goal-meta__item">
                        <span className="dashboard-goal-meta__label">
                          Latest check-in:
                        </span>
                        <span
                          className={`dashboard-goal-meta__value ${getCheckInStatusClass(
                            goal.latestCheckInStatus
                          )}`}
                        >
                          {goal.latestCheckInStatus}
                        </span>
                      </span>

                      <span className="dashboard-goal-meta__item">
                        <span className="dashboard-goal-meta__label">Buddy:</span>
                        <span
                          className={`dashboard-goal-meta__value ${getBuddyStatusClass(
                            goal.buddyStatus
                          )}`}
                        >
                          {formatBuddyLabel(goal.buddyName, goal.buddyStatus)}
                        </span>
                      </span>
                    </div>
                  </div>

                  <Link to={`/goals/${goal.id}`} className="btn secondary">
                    View Goal
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Goals I’m Supporting</h2>
          <Link to="/goals" className="btn link">
            View all ({supportedGoals.length})
          </Link>
        </div>

        {loading ? (
          <p className="dashboard-state">Loading supported goals...</p>
        ) : visibleSupportedGoals.length === 0 ? (
          <p className="dashboard-state">
            You’re not supporting any accepted goals yet.
          </p>
        ) : (
          <div className="dashboard-list">
            {visibleSupportedGoals.map((goal) => {
              const category = categoryMap[goal.category] || categoryMap.OTHER;

              return (
                <article key={goal.id} className="dashboard-row">
                  <div className="dashboard-row__content">
                    <h3 className="dashboard-goal-title">{goal.title}</h3>

                    <div className="dashboard-goal-meta">
                      <span className="dashboard-goal-meta__item dashboard-goal-meta__item--category">
                        <span className="dashboard-goal-meta__icon" aria-hidden="true">
                          {category.icon}
                        </span>
                        <span>{category.label}</span>
                      </span>

                      <span className="dashboard-goal-meta__item">
                        <span className="dashboard-goal-meta__label">Owner:</span>
                        <span className="dashboard-goal-meta__value">
                          {goal.ownerName}
                        </span>
                      </span>

                      <span className="dashboard-goal-meta__item">
                        <span className="dashboard-goal-meta__label">
                          Latest check-in:
                        </span>
                        <span
                          className={`dashboard-goal-meta__value ${getCheckInStatusClass(
                            goal.latestCheckInStatus
                          )}`}
                        >
                          {goal.latestCheckInStatus}
                        </span>
                      </span>
                    </div>
                  </div>

                  <Link to={`/goals/${goal.id}`} className="btn secondary">
                    View Goal
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>My Pods</h2>
          <Link to="/pods" className="btn link">
            View all ({pods.length})
          </Link>
        </div>

        {loading ? (
          <p className="dashboard-state">Loading pods...</p>
        ) : visiblePods.length === 0 ? (
          <p className="dashboard-state">
            No pods yet. Create one when you’re ready.
          </p>
        ) : (
          <div className="dashboard-list">
            {visiblePods.map((pod) => (
              <article
                key={pod.id}
                className="dashboard-row dashboard-row--stacked"
              >
                <div className="dashboard-row__content">
                  <h3>{pod.name}</h3>
                  <p>{pod.summary}</p>
                  <p className="dashboard-submeta">
                    {pod.activePodGoalsCount} active pod goal
                    {pod.activePodGoalsCount === 1 ? "" : "s"}
                    {" • "}
                    {pod.memberCount} member{pod.memberCount === 1 ? "" : "s"}
                  </p>
                </div>

                <Link to={`/pods/${pod.id}`} className="btn secondary">
                  View Pod
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Needs My Review</h2>
          {!loading && (
            <span className="dashboard-inline-note">
              {formatReviewCount(reviewCount)}
            </span>
          )}
        </div>

        {loading ? (
          <p className="dashboard-state">Loading review items...</p>
        ) : visibleReviewItems.length === 0 ? (
          <p className="dashboard-state">
            No check-ins are waiting for your review right now.
          </p>
        ) : (
          <div className="dashboard-list">
            {visibleReviewItems.map((item) => (
              <article
                key={item.id}
                className="dashboard-row dashboard-row--stacked"
              >
                <div className="dashboard-row__content">
                  <h3 className="dashboard-pending-title">{item.title}</h3>
                  <p className="dashboard-attention-text">{item.description}</p>

                  <div className="dashboard-row__meta">
                    <span className="attention-pill">{item.label}</span>
                  </div>
                </div>

                <Link to={item.actionTo} className="btn secondary">
                  {item.actionLabel}
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}