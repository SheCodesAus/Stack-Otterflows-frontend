import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { authFetch } from "../api/auth-fetch";
import "./GoalDetailPage.css";

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

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function CategoryChip({ category }) {
  const item = categoryMap[category] || categoryMap.OTHER;

  return (
    <span className="goal-category-chip">
      <span className="goal-category-chip__icon" aria-hidden="true">
        {item.icon}
      </span>
      <span>{item.label}</span>
    </span>
  );
}

function StatusPill({ status }) {
  const slug = (status || "unknown").toLowerCase().replace(/\s+/g, "-");

  return (
    <span className={`goal-status-pill goal-status-pill--${slug}`}>
      {status || "Unknown"}
    </span>
  );
}

export default function GoalDetailPage() {
  const { goalId } = useParams();

  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchGoalDetail() {
      try {
        setLoading(true);
        setError("");

        const response = await authFetch(`goals/${goalId}/`);

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data?.detail || `Failed to load goal detail (${response.status})`
          );
        }

        setGoal(data);
      } catch (err) {
        setError(err.message || "Something went wrong while loading the goal.");
      } finally {
        setLoading(false);
      }
    }

    fetchGoalDetail();
  }, [goalId]);

  const ownerName = useMemo(() => {
    if (!goal) return "";
    return goal.owner_display_name || goal.owner_username || "Unknown";
  }, [goal]);

  if (loading) {
    return (
      <section className="goal-detail-page">
        <div className="goal-detail-topbar">
          <Link to="/goals" className="btn link">
            Back to Goals
          </Link>
        </div>
        <p>Loading goal detail...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="goal-detail-page">
        <div className="goal-detail-topbar">
          <Link to="/goals" className="btn link">
            Back to Goals
          </Link>
        </div>
        <p>{error}</p>
      </section>
    );
  }

  if (!goal) {
    return (
      <section className="goal-detail-page">
        <div className="goal-detail-topbar">
          <Link to="/goals" className="btn link">
            Back to Goals
          </Link>
        </div>
        <p>Goal not found.</p>
      </section>
    );
  }

  return (
    <section className="goal-detail-page">
      <div className="goal-detail-topbar">
        <Link to="/goals" className="btn link">
          Back to Goals
        </Link>
      </div>

      <header className="goal-detail-hero">
        <div className="goal-detail-hero__meta">
          <CategoryChip category={goal.category} />
          <StatusPill status={goal.is_active ? "Active" : "Inactive"} />
        </div>

        <h1>{goal.title}</h1>
        <p>{goal.motivation || "No motivation added yet."}</p>
      </header>

      <section className="goal-detail-grid">
        <article className="goal-card">
          <h2>Goal Overview</h2>

          <div className="goal-overview-grid">
            <div className="goal-overview-item">
              <span className="goal-overview-item__label">Owner</span>
              <strong>{ownerName}</strong>
            </div>

            <div className="goal-overview-item">
              <span className="goal-overview-item__label">Metric</span>
              <strong>{goal.metric_type}</strong>
            </div>

            <div className="goal-overview-item">
              <span className="goal-overview-item__label">Period</span>
              <strong>{goal.period}</strong>
            </div>

            <div className="goal-overview-item">
              <span className="goal-overview-item__label">Target</span>
              <strong>
                {goal.target_value} {goal.unit_label || ""}
              </strong>
            </div>

            <div className="goal-overview-item">
              <span className="goal-overview-item__label">Start Date</span>
              <strong>{formatDate(goal.start_date)}</strong>
            </div>

            <div className="goal-overview-item">
              <span className="goal-overview-item__label">End Date</span>
              <strong>{formatDate(goal.end_date)}</strong>
            </div>

            <div className="goal-overview-item">
              <span className="goal-overview-item__label">Latest Check-in</span>
              <strong>{goal.latest_checkin_status || "No check-ins yet"}</strong>
            </div>

            <div className="goal-overview-item">
              <span className="goal-overview-item__label">Created</span>
              <strong>{formatDate(goal.created_at)}</strong>
            </div>
          </div>
        </article>

        <article className="goal-card">
          <h2>Buddy Assignment</h2>

          {goal.assignments?.length ? (
            <div className="goal-summary-list">
              {goal.assignments.map((assignment) => (
                <div key={assignment.id} className="goal-summary-row">
                  <span>
                    {assignment.buddy_display_name ||
                      assignment.buddy_username ||
                      `User ${assignment.buddy}`}
                  </span>
                  <strong>{assignment.consent_status}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p>No buddy assigned yet.</p>
          )}

          <div className="goal-detail-actions">
            <button type="button" className="btn primary">
              Submit Check-in
            </button>
          </div>
        </article>
      </section>

      <article className="goal-card">
        <div className="goal-card__header">
          <h2>Check-in History</h2>
        </div>

        {goal.checkins?.length ? (
          <div className="goal-checkin-list">
            {goal.checkins.map((checkin) => (
              <div key={checkin.id} className="goal-checkin-row">
                <div className="goal-checkin-row__content">
                  <div className="goal-checkin-row__top">
                    <strong>{formatDate(checkin.period_start)}</strong>
                    <StatusPill status={checkin.status} />
                  </div>

                  <p>
                    <span className="goal-checkin-label">Value:</span> {checkin.value}{" "}
                    {goal.unit_label || ""}
                  </p>

                  {checkin.note ? <p>{checkin.note}</p> : null}

                  <p>
                    <span className="goal-checkin-label">Submitted by:</span>{" "}
                    {checkin.created_by_display_name ||
                      checkin.created_by_username ||
                      `User ${checkin.created_by}`}
                  </p>

                  {checkin.verified_at ? (
                    <p>
                      <span className="goal-checkin-label">Verified at:</span>{" "}
                      {formatDateTime(checkin.verified_at)}
                    </p>
                  ) : null}

                  {checkin.rejection_reason ? (
                    <p className="goal-checkin-reason">
                      <span className="goal-checkin-label">Reason:</span>{" "}
                      {checkin.rejection_reason}
                    </p>
                  ) : null}
                </div>

                <button type="button" className="btn secondary">
                  View Check-in
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No check-ins yet.</p>
        )}
      </article>

      <article className="goal-card">
        <div className="goal-card__header">
          <h2>Comments</h2>
          <button type="button" className="btn link">
            Add Comment
          </button>
        </div>

        {goal.comments?.length ? (
          <div className="goal-comment-list">
            {goal.comments.map((comment) => (
              <div key={comment.id} className="goal-comment">
                <div className="goal-comment__top">
                  <strong>
                    {comment.author_display_name ||
                      comment.author_username ||
                      `User ${comment.author}`}
                  </strong>
                  <span className="goal-comment__kind">{comment.kind}</span>
                  <span className="goal-comment__date">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                <p>{comment.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No comments yet.</p>
        )}
      </article>
    </section>
  );
}