import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { authFetch } from "../api/auth-fetch";

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

function StatusPill({ status }) {
  const slug = (status || "unknown").toLowerCase().replace(/\s+/g, "-");

  return (
    <span className={`goal-status-pill goal-status-pill--${slug}`}>
      {status || "Unknown"}
    </span>
  );
}

export default function PodDetailPage() {
  const { podId } = useParams();

  const [pod, setPod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPodDetail() {
      try {
        setLoading(true);
        setError("");

        const response = await authFetch(`pods/${podId}/`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.detail || `Failed to load pod detail (${response.status})`);
        }

        setPod(data);
      } catch (err) {
        setError(err.message || "Something went wrong while loading the pod.");
      } finally {
        setLoading(false);
      }
    }

    fetchPodDetail();
  }, [podId]);

  const ownerName = useMemo(() => {
    if (!pod) return "";
    return pod.owner_display_name || pod.owner_username || "Unknown";
  }, [pod]);

  if (loading) {
    return (
      <section className="page-shell">
        <div className="page-actions">
          <Link to="/pods" className="btn link">
            Back to Pods
          </Link>
        </div>
        <p>Loading pod detail...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-shell">
        <div className="page-actions">
          <Link to="/pods" className="btn link">
            Back to Pods
          </Link>
        </div>
        <p>{error}</p>
      </section>
    );
  }

  if (!pod) {
    return (
      <section className="page-shell">
        <div className="page-actions">
          <Link to="/pods" className="btn link">
            Back to Pods
          </Link>
        </div>
        <p>Pod not found.</p>
      </section>
    );
  }

  const members = pod.memberships || pod.members || [];
  const podGoals = pod.pod_goals || pod.goals || [];
  const podCheckins = pod.pod_checkins || pod.checkins || [];
  const podComments = pod.pod_comments || pod.comments || [];

  return (
    <section className="page-shell">
      <div className="page-actions">
        <Link to="/pods" className="btn link">
          Back to Pods
        </Link>
      </div>

      <header className="goal-detail-hero">
        <div className="goal-detail-hero__meta">
          <StatusPill status={pod.is_active ? "Active" : "Inactive"} />
        </div>

        <h1>{pod.name || "Untitled Pod"}</h1>
        <p>{pod.description || "No pod description added yet."}</p>
      </header>

      <section className="goal-detail-grid">
        <article className="goal-card">
          <h2>Pod Overview</h2>

          <div className="goal-overview-grid">
            <div className="goal-overview-item">
              <span className="goal-overview-item__label">Owner</span>
              <strong>{ownerName}</strong>
            </div>

            <div className="goal-overview-item">
              <span className="goal-overview-item__label">Members</span>
              <strong>{members.length}</strong>
            </div>

            <div className="goal-overview-item">
              <span className="goal-overview-item__label">Shared Goals</span>
              <strong>{podGoals.length}</strong>
            </div>

            <div className="goal-overview-item">
              <span className="goal-overview-item__label">Created</span>
              <strong>{formatDate(pod.created_at)}</strong>
            </div>
          </div>
        </article>

        <article className="goal-card">
          <h2>Members</h2>

          {members.length ? (
            <div className="goal-summary-list">
              {members.map((member) => (
                <div
                  key={member.id || member.user || `${member.user_username}-${member.status}`}
                  className="goal-summary-row"
                >
                  <span>
                    {member.user_display_name ||
                      member.user_username ||
                      `User ${member.user}`}
                  </span>
                  <strong>{member.status || member.membership_status || "Unknown"}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p>No members yet.</p>
          )}
        </article>
      </section>

      <article className="goal-card">
        <div className="goal-card__header">
          <h2>Shared Goals</h2>
        </div>

        {podGoals.length ? (
          <div className="goal-summary-list">
            {podGoals.map((goal) => (
              <div key={goal.id} className="goal-summary-row">
                <span>{goal.title || goal.goal_title || `Pod Goal ${goal.id}`}</span>
                <strong>{goal.status || "Active"}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p>No shared goals yet.</p>
        )}
      </article>

      <article className="goal-card">
        <div className="goal-card__header">
          <h2>Pod Check-ins</h2>
        </div>

        {podCheckins.length ? (
          <div className="goal-checkin-list">
            {podCheckins.map((checkin) => (
              <div key={checkin.id} className="goal-checkin-row">
                <div className="goal-checkin-row__content">
                  <div className="goal-checkin-row__top">
                    <strong>
                      {checkin.period_start
                        ? formatDate(checkin.period_start)
                        : `Check-in ${checkin.id}`}
                    </strong>
                    <StatusPill status={checkin.status} />
                  </div>

                  {checkin.note ? <p>{checkin.note}</p> : null}

                  <p>
                    <span className="goal-checkin-label">Submitted by:</span>{" "}
                    {checkin.created_by_display_name ||
                      checkin.created_by_username ||
                      `User ${checkin.created_by}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No pod check-ins yet.</p>
        )}
      </article>

      <article className="goal-card">
        <div className="goal-card__header">
          <h2>Pod Comments</h2>
        </div>

        {podComments.length ? (
          <div className="goal-comment-list">
            {podComments.map((comment) => (
              <div key={comment.id} className="goal-comment">
                <div className="goal-comment__top">
                  <strong>
                    {comment.author_display_name ||
                      comment.author_username ||
                      `User ${comment.author}`}
                  </strong>
                  <span className="goal-comment__date">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                <p>{comment.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No pod comments yet.</p>
        )}
      </article>
    </section>
  );
}