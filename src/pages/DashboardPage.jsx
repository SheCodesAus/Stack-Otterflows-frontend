import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import getCurrentUser from "../api/getCurrentUser";
import { fetchNotificationSummary, fetchNotifications } from "../api/notifications";
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

const CHECKIN_NOTIFICATION_TYPES = new Set([
  "CHECKIN_SUBMITTED",
  "POD_CHECKIN_SUBMITTED",
]);

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
  if (!name && status === "Not assigned") return "Not assigned";
  if (!name) return status;
  if (status === "Pending") return `Buddy ${name} (Pending)`;
  return `Buddy ${name}`;
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

function normalisePendingCheckIn(notification) {
  return {
    id: notification.id,
    label: notification.is_needs_review ? "Needs review" : notification.type_label,
    title: notification.title,
    description: notification.message,
    actionLabel: "Review Check-in",
    actionTo: notification.target_url || "/dashboard",
  };
}

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [goals, setGoals] = useState([]);
  const [pods, setPods] = useState([]);
  const [pendingCheckIns, setPendingCheckIns] = useState([]);
  const [notificationSummary, setNotificationSummary] = useState(null);
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
          summary,
          needsReviewNotifications,
        ] = await Promise.all([
          getCurrentUser(),
          fetchGoals(),
          fetchPods(),
          fetchNotificationSummary(),
          fetchNotifications({ tab: "needs_review", limit: 50 }),
        ]);

        setUser(currentUser);
        setNotificationSummary(summary);

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

        const realPendingCheckIns = needsReviewNotifications
          .filter((notification) =>
            CHECKIN_NOTIFICATION_TYPES.has(notification.notif_type)
          )
          .map(normalisePendingCheckIn);

        setGoals(realGoals);
        setPods(realPods);
        setPendingCheckIns(realPendingCheckIns);
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
  const visiblePods = useMemo(() => pods.slice(0, 3), [pods]);

  const activeGoalsCount = useMemo(
    () => goals.filter((goal) => goal.status === "ACTIVE").length,
    [goals]
  );

  const pendingCheckInsCount = pendingCheckIns.length;

  const activePodsCount = useMemo(
    () => pods.filter((pod) => pod.isActive).length,
    [pods]
  );

  const activePodGoalsCount = useMemo(
    () => pods.reduce((total, pod) => total + pod.activePodGoalsCount, 0),
    [pods]
  );

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
            <span className="dashboard-stat__label">Pending check-ins</span>
            <strong>{loading ? "…" : pendingCheckInsCount}</strong>
          </div>

          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Active pods</span>
            <strong>{loading ? "…" : activePodsCount}</strong>
          </div>

          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Active pod goals</span>
            <strong>{loading ? "…" : activePodGoalsCount}</strong>
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
          <p className="dashboard-state">No goals yet. Create your first goal to get started.</p>
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
          <h2>My Pods</h2>
          <Link to="/pods" className="btn link">
            View all ({pods.length})
          </Link>
        </div>

        {loading ? (
          <p className="dashboard-state">Loading pods...</p>
        ) : visiblePods.length === 0 ? (
          <p className="dashboard-state">No pods yet. Create one when you’re ready.</p>
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
                    {pod.activePodGoalsCount} active pod goal{pod.activePodGoalsCount === 1 ? "" : "s"}
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
          <h2>Pending Check-ins</h2>
          {!loading && notificationSummary ? (
            <span className="dashboard-inline-note">
              {notificationSummary.needs_review_count} needs review overall
            </span>
          ) : null}
        </div>

        {loading ? (
          <p className="dashboard-state">Loading pending check-ins...</p>
        ) : pendingCheckIns.length === 0 ? (
          <p className="dashboard-state">No pending check-ins right now.</p>
        ) : (
          <div className="dashboard-list">
            {pendingCheckIns.map((item) => (
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