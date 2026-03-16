import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { authFetch } from "../api/auth-fetch";
import "./PodDetailPage.css";

const categoryMap = {
  HEALTH: { label: "Health", icon: "🫀" },
  EDUCATION: { label: "Education", icon: "📚" },
  FITNESS: { label: "Fitness", icon: "💪" },
  CAREER: { label: "Career", icon: "💼" },
  CREATIVE: { label: "Creative", icon: "🎨" },
  WELLBEING: { label: "Wellbeing", icon: "🌿" },
  OTHER: { label: "Other", icon: "✨" },
};

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status) {
  if (!status) return "Unknown";

  return status
    .toString()
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusTone(status) {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "INVITED":
      return "planned";
    case "DECLINED":
    case "REMOVED":
      return "rejected";
    case "LEFT":
      return "inactive";
    case "OWNER":
    case "ADMIN":
      return "approved";
    case "PLANNED":
      return "planned";
    case "PAUSED":
      return "paused";
    case "COMPLETED":
      return "completed";
    case "ARCHIVED":
      return "inactive";
    default:
      return "inactive";
  }
}

function formatFrequency(period) {
  return period === "DAILY" ? "Daily" : "Weekly";
}

function singularizeUnit(unitLabel) {
  const cleaned = unitLabel?.trim();

  if (!cleaned) return "time";

  const lower = cleaned.toLowerCase();

  if (lower === "times") return "time";

  if (lower.endsWith("ies")) {
    return `${cleaned.slice(0, -3)}y`;
  }

  if (lower.endsWith("s") && !lower.endsWith("ss")) {
    return cleaned.slice(0, -1);
  }

  return cleaned;
}

function formatUnitLabel(unitLabel, targetValue) {
  const cleaned = unitLabel?.trim();

  if (!cleaned) {
    return targetValue === 1 ? "time" : "times";
  }

  return targetValue === 1 ? singularizeUnit(cleaned) : cleaned;
}

function formatTarget(goal) {
  const periodWord = goal.period === "DAILY" ? "day" : "week";

  if (goal.metric_type === "BINARY") {
    return `Complete once per ${periodWord}`;
  }

  if (goal.metric_type === "DURATION") {
    const minutes = Number(goal.target_value) || 0;

    if (minutes >= 60 && minutes % 60 === 0) {
      const hours = minutes / 60;
      return `${hours} ${hours === 1 ? "hour" : "hours"} per ${periodWord}`;
    }

    return `${minutes} minutes per ${periodWord}`;
  }

  if (goal.metric_type === "COUNT") {
    const unit = formatUnitLabel(goal.unit_label, goal.target_value);
    return `${goal.target_value} ${unit} per ${periodWord}`;
  }

  return "Not set";
}

function getRoleTone(role) {
  switch (role) {
    case "OWNER":
      return "approved";
    case "ADMIN":
      return "active";
    case "MEMBER":
      return "inactive";
    default:
      return "inactive";
  }
}

function StatusPill({ children, tone = "inactive" }) {
  return (
    <span className={`pod-status-pill pod-status-pill--${tone}`}>
      {children}
    </span>
  );
}

function CategoryChip({ category }) {
  const item = categoryMap[category] || categoryMap.OTHER;

  return (
    <span className="pod-category-chip">
      <span className="pod-category-chip__icon" aria-hidden="true">
        {item.icon}
      </span>
      <span>{item.label}</span>
    </span>
  );
}

export default function PodDetailPage() {
  const { podId } = useParams();

  const [pod, setPod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPod() {
      try {
        setLoading(true);
        setError("");

        const response = await authFetch(`pods/${podId}/`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.detail || "Failed to load pod.");
        }

        setPod(data);
      } catch (err) {
        setError(err.message || "Something went wrong while loading the pod.");
      } finally {
        setLoading(false);
      }
    }

    loadPod();
  }, [podId]);

  const activeMembers = useMemo(() => {
    if (!pod?.memberships) return [];
    return pod.memberships.filter((member) => member.status === "ACTIVE");
  }, [pod]);

  const invitedMembers = useMemo(() => {
    if (!pod?.memberships) return [];
    return pod.memberships.filter((member) => member.status === "INVITED");
  }, [pod]);

  const sortedGoals = useMemo(() => {
    if (!pod?.pod_goals) return [];

    return [...pod.pod_goals].sort((a, b) => {
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      return bDate - aDate;
    });
  }, [pod]);

  if (loading) {
    return (
      <section className="page-shell pod-detail-page">
        <div className="pod-detail-topbar">
          <Link to="/pods" className="pod-detail-backlink">
            <span aria-hidden="true">←</span>
            <span>Back to Pods</span>
          </Link>
        </div>

        <p>Loading pod...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-shell pod-detail-page">
        <div className="pod-detail-topbar">
          <Link to="/pods" className="pod-detail-backlink">
            <span aria-hidden="true">←</span>
            <span>Back to Pods</span>
          </Link>
        </div>

        <p>{error}</p>
      </section>
    );
  }

  if (!pod) {
    return (
      <section className="page-shell pod-detail-page">
        <div className="pod-detail-topbar">
          <Link to="/pods" className="pod-detail-backlink">
            <span aria-hidden="true">←</span>
            <span>Back to Pods</span>
          </Link>
        </div>

        <p>Pod not found.</p>
      </section>
    );
  }

  return (
    <section className="page-shell pod-detail-page">
      <div className="pod-detail-topbar">
        <Link to="/pods" className="pod-detail-backlink">
          <span aria-hidden="true">←</span>
          <span>Back to Pods</span>
        </Link>
      </div>

      <header className="pod-detail-hero">
        <div className="pod-detail-hero__main">
          <div className="pod-detail-hero__meta">
            <StatusPill tone={pod.is_active ? "active" : "inactive"}>
              {pod.is_active ? "Active Pod" : "Inactive Pod"}
            </StatusPill>
          </div>

          <h1>{pod.name}</h1>

          <p className="pod-detail-hero__summary">
            Shared accountability space for goals, check-ins, and progress.
          </p>

          <p className="pod-detail-hero__description">
            {pod.description || "No description added yet."}
          </p>

          <div className="pod-detail-hero__actions">
            <Link to={`/pods/${pod.id}/goals/new`} className="btn primary">
              Create Pod Goal
            </Link>

            <Link to={`/pods/${pod.id}/edit`} className="btn secondary">
              Edit Pod
            </Link>

            <button type="button" className="btn secondary" disabled>
              Invite Member
            </button>
          </div>

          <p className="pod-side-note">
            Member invites can be wired in next from the pod memberships endpoint.
          </p>
        </div>
      </header>

      <section className="pod-detail-grid">
        <div className="pod-detail-main">
          <article className="pod-card">
            <div className="pod-card__header">
              <h2>Pod Goals</h2>
            </div>

            {sortedGoals.length ? (
              <div className="pod-goal-list">
                {sortedGoals.map((goal) => (
                  <div key={goal.id} className="pod-goal-row">
                    <div className="pod-goal-row__content">
                      <div className="pod-goal-row__meta">
                        <CategoryChip category={goal.category} />
                        <StatusPill tone={getStatusTone(goal.status)}>
                          {formatStatus(goal.status)}
                        </StatusPill>
                      </div>

                      <h3>{goal.title}</h3>

                      <p className="pod-goal-row__summary">
                        {goal.motivation || "No motivation added yet."}
                      </p>

                      <div className="pod-goal-row__details">
                        <span>{formatFrequency(goal.period)}</span>
                        <span>•</span>
                        <span>{formatTarget(goal)}</span>
                      </div>
                    </div>

                    <div className="pod-goal-row__actions">
                      <Link
                        to={`/pods/${pod.id}/goals/${goal.id}`}
                        className="btn secondary"
                      >
                        Open Goal
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pod-empty-state">
                <p>No pod goals yet.</p>
                <Link to={`/pods/${pod.id}/goals/new`} className="btn primary">
                  Create First Pod Goal
                </Link>
              </div>
            )}
          </article>

          <article className="pod-card">
            <div className="pod-card__header">
              <h2>Active Members</h2>
            </div>

            {activeMembers.length ? (
              <div className="pod-member-list">
                {activeMembers.map((member) => {
                  const displayName =
                    member.user_display_name ||
                    member.user_username ||
                    `User ${member.user}`;

                  return (
                    <div key={member.id} className="pod-member-row">
                      <div className="pod-member-row__content">
                        <strong>{displayName}</strong>
                        <span className="pod-member-row__meta">
                          Joined {formatDate(member.created_at)}
                        </span>
                      </div>

                      <div className="pod-member-row__pills">
                        <StatusPill tone={getRoleTone(member.role)}>
                          {formatStatus(member.role)}
                        </StatusPill>
                        <StatusPill tone={getStatusTone(member.status)}>
                          {formatStatus(member.status)}
                        </StatusPill>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="pod-empty-text">No active members yet.</p>
            )}
          </article>

          {invitedMembers.length ? (
            <article className="pod-card">
              <div className="pod-card__header">
                <h2>Pending Invites</h2>
              </div>

              <div className="pod-member-list">
                {invitedMembers.map((member) => {
                  const displayName =
                    member.user_display_name ||
                    member.user_username ||
                    `User ${member.user}`;

                  return (
                    <div key={member.id} className="pod-member-row">
                      <div className="pod-member-row__content">
                        <strong>{displayName}</strong>
                        <span className="pod-member-row__meta">
                          Invited {formatDate(member.created_at)}
                        </span>
                      </div>

                      <div className="pod-member-row__pills">
                        <StatusPill tone={getRoleTone(member.role)}>
                          {formatStatus(member.role)}
                        </StatusPill>
                        <StatusPill tone="planned">
                          {formatStatus(member.status)}
                        </StatusPill>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          ) : null}
        </div>

        <aside className="pod-detail-side">
          <article className="pod-card">
            <div className="pod-card__header">
              <h2>Pod Summary</h2>
            </div>

            <div className="pod-summary-list">
              <div className="pod-summary-row">
                <span>Created by</span>
                <strong>
                  {pod.created_by_display_name ||
                    pod.created_by_username ||
                    "Unknown"}
                </strong>
              </div>

              <div className="pod-summary-row">
                <span>Created</span>
                <strong>{formatDate(pod.created_at)}</strong>
              </div>

              <div className="pod-summary-row">
                <span>Status</span>
                <strong>{pod.is_active ? "Active" : "Inactive"}</strong>
              </div>

              <div className="pod-summary-row">
                <span>Active members</span>
                <strong>{activeMembers.length}</strong>
              </div>

              <div className="pod-summary-row">
                <span>Pending invites</span>
                <strong>{invitedMembers.length}</strong>
              </div>

              <div className="pod-summary-row">
                <span>Pod goals</span>
                <strong>{sortedGoals.length}</strong>
              </div>
            </div>
          </article>

          <article className="pod-card">
            <div className="pod-card__header">
              <h2>Next Steps</h2>
            </div>

            <div className="pod-next-steps">
              <p>Create a pod goal to start tracking a shared challenge.</p>
              <p>Invite members so the pod can check in together.</p>
              <p>Open a pod goal to review progress, comments, and activity.</p>
            </div>
          </article>
        </aside>
      </section>
    </section>
  );
}