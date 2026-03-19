import { useCallback, useEffect, useMemo, useState } from "react";
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
    case "PLANNED":
      return "planned";
    case "DECLINED":
    case "REMOVED":
      return "rejected";
    case "LEFT":
    case "ARCHIVED":
      return "inactive";
    case "OWNER":
      return "approved";
    case "ADMIN":
      return "active";
    case "PAUSED":
      return "paused";
    case "COMPLETED":
      return "completed";
    default:
      return "inactive";
  }
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

function getDisplayName(member) {
  return (
    member.user_display_name ||
    member.user_username ||
    `User ${member.user}`
  );
}

function getInitials(name) {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("") || "?";
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

  const loadPod = useCallback(async () => {
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
  }, [podId]);

  useEffect(() => {
    loadPod();
  }, [loadPod]);

  const activeMembers = useMemo(() => {
    const memberships = pod?.memberships ?? [];
    return memberships.filter((member) => member.status === "ACTIVE");
  }, [pod?.memberships]);

  const invitedMembers = useMemo(() => {
    const memberships = pod?.memberships ?? [];
    return memberships.filter((member) => member.status === "INVITED");
  }, [pod?.memberships]);

  const ownerCount = useMemo(() => {
    return activeMembers.filter((member) => member.role === "OWNER").length;
  }, [activeMembers]);

  const adminCount = useMemo(() => {
    return activeMembers.filter((member) => member.role === "ADMIN").length;
  }, [activeMembers]);

  const sortedGoals = useMemo(() => {
    if (!pod?.pod_goals) return [];

    return [...pod.pod_goals].sort((a, b) => {
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      return bDate - aDate;
    });
  }, [pod?.pod_goals]);

  if (loading) {
    return (
      <section className="page-shell pod-detail-page">
        <div className="pod-detail-topbar">
          <Link to="/pods" className="pod-detail-backlink">
            <span aria-hidden="true">←</span>
            <span>Back to Pods</span>
          </Link>
        </div>

        <div className="pod-card">
          <p className="pod-empty-text">Loading pod...</p>
        </div>
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

        <div className="pod-card">
          <p className="pod-empty-text">{error}</p>
        </div>
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

        <div className="pod-card">
          <p className="pod-empty-text">Pod not found.</p>
        </div>
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
        <div className="pod-detail-hero__meta">
          <CategoryChip category={pod.category} />
          <StatusPill tone={pod.is_active ? "active" : "inactive"}>
            {pod.is_active ? "Active Pod" : "Inactive Pod"}
          </StatusPill>
        </div>

        <h1>{pod.name}</h1>

        <p className="pod-detail-hero__summary">
          Shared accountability space for goals, check-ins, and progress.
        </p>

        <p className="pod-detail-hero__description">
          {pod.description ||
            "Add a short description so people know what this pod is about."}
        </p>

        <div className="pod-detail-hero__actions">
  <Link to={`/pods/${pod.id}/goals/new`} className="btn primary">
    Create Pod Goal
  </Link>

  <Link to={`/pods/${pod.id}/share`} className="btn secondary">
    Share Pod QR
  </Link>

  <Link to={`/pods/${pod.id}/edit`} className="btn utility">
    Edit Pod
  </Link>
</div>
      </header>

      <section className="pod-detail-grid">
        <div className="pod-detail-main">
          <article className="pod-card">
            <div className="pod-card__header pod-card__header--split">
              <div>
                <h2 className="pod-card__title pod-card__title--accent">
                  Pod Goals
                </h2>
                <p>Shared goals keep the pod focused and moving together.</p>
              </div>

              <span className="pod-card__count">
                {sortedGoals.length} {sortedGoals.length === 1 ? "goal" : "goals"}
              </span>
            </div>

            {sortedGoals.length ? (
              <div className="pod-goal-list">
                {sortedGoals.map((goal) => (
                  <div key={goal.id} className="pod-goal-item">
                    <div className="pod-goal-item__main">
                      <div className="pod-goal-item__meta">
                        <CategoryChip category={goal.category} />
                        <StatusPill tone={getStatusTone(goal.status)}>
                          {formatStatus(goal.status)}
                        </StatusPill>
                      </div>

                      <h3>{goal.title}</h3>

                      <p className="pod-goal-item__summary">
                        {goal.motivation || "No motivation added yet."}
                      </p>

                      <div className="pod-goal-item__details">
                        <span>{formatFrequency(goal.period)}</span>
                        <span>•</span>
                        <span>{formatTarget(goal)}</span>
                        <span>•</span>
                        <span>Created {formatDate(goal.created_at)}</span>
                      </div>
                    </div>

                    <div className="pod-goal-item__actions">
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
                <p>No pod goals yet. Start with one shared challenge.</p>

                <Link to={`/pods/${pod.id}/goals/new`} className="btn primary">
                  Create First Pod Goal
                </Link>
              </div>
            )}
          </article>

          <article className="pod-card">
            <div className="pod-card__header pod-card__header--split">
              <div>
                <h2 className="pod-card__title pod-card__title--accent">
                  Active Members
                </h2>
                <p>These members can check in, comment, and review progress.</p>
              </div>

              <span className="pod-card__count">
                {activeMembers.length}{" "}
                {activeMembers.length === 1 ? "member" : "members"}
              </span>
            </div>

            {activeMembers.length ? (
              <div className="pod-member-list">
                {activeMembers.map((member) => {
                  const displayName = getDisplayName(member);

                  return (
                    <div key={member.id} className="pod-member-row">
                      <div className="pod-member-row__identity">
                        <div className="pod-member-avatar" aria-hidden="true">
                          {getInitials(displayName)}
                        </div>

                        <div className="pod-member-row__content">
                          <strong>{displayName}</strong>
                          <span className="pod-member-row__meta">
                            Joined {formatDate(member.created_at)}
                          </span>
                        </div>
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
              <div className="pod-card__header pod-card__header--split">
                <div>
                  <h2 className="pod-card__title pod-card__title--accent">
                    Pending Invites
                  </h2>
                  <p>These people have been invited but haven’t responded yet.</p>
                </div>

                <span className="pod-card__count">
                  {invitedMembers.length}{" "}
                  {invitedMembers.length === 1 ? "invite" : "invites"}
                </span>
              </div>

              <div className="pod-member-list">
                {invitedMembers.map((member) => {
                  const displayName = getDisplayName(member);

                  return (
                    <div key={member.id} className="pod-member-row">
                      <div className="pod-member-row__identity">
                        <div className="pod-member-avatar" aria-hidden="true">
                          {getInitials(displayName)}
                        </div>

                        <div className="pod-member-row__content">
                          <strong>{displayName}</strong>
                          <span className="pod-member-row__meta">
                            Invited {formatDate(member.created_at)}
                          </span>
                        </div>
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
          <article className="pod-card pod-card--details">
            <div className="pod-card__header">
              <h2 className="pod-card__title pod-card__title--accent">
                Pod Overview
              </h2>
              <p>See who created this pod, when it started, and who helps manage it.</p>
            </div>

            <div className="pod-details-panel">
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
              </div>

              <div className="pod-overview-metrics">
                <div className="pod-overview-metric">
                  <span className="pod-overview-metric__label">Owners</span>
                  <strong className="pod-overview-metric__value">
                    {ownerCount}
                  </strong>
                </div>

                <div className="pod-overview-metric">
                  <span className="pod-overview-metric__label">Admins</span>
                  <strong className="pod-overview-metric__value">
                    {adminCount}
                  </strong>
                </div>
              </div>
            </div>

            <div className="pod-card__actions pod-card__actions--center">
              <Link to={`/pods/${pod.id}/members`} className="btn primary">
                Open Member Manager
              </Link>
            </div>

            <div className="pod-side-highlight">
              Active pod members can review pending check-ins, but no one can
              verify their own.
            </div>
          </article>
        </aside>
      </section>
    </section>
  );
}