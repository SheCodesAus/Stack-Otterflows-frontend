import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authFetch } from "../api/auth-fetch";
import "./GoalsPage.css";

const categoryMap = {
  HEALTH: { label: "Health", icon: "🫀" },
  EDUCATION: { label: "Education", icon: "📚" },
  FITNESS: { label: "Fitness", icon: "💪" },
  CAREER: { label: "Career", icon: "💼" },
  CREATIVE: { label: "Creative", icon: "🎨" },
  WELLBEING: { label: "Wellbeing", icon: "🌿" },
  OTHER: { label: "Other", icon: "✨" },
};

function formatShortDate(dateString) {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}

function formatCount(count, singular, plural = `${singular}s`) {
  const safeCount = Number.isFinite(count) ? count : 0;
  return `${safeCount} ${safeCount === 1 ? singular : plural}`;
}

function getPodCategory(pod) {
  return categoryMap[pod.category] || categoryMap.OTHER;
}

function getPodMetaLine(pod) {
  const created = formatShortDate(pod.created_at);
  return created ? `Created ${created}` : null;
}

function PodRow({ pod }) {
  const category = getPodCategory(pod);
  const metaLine = getPodMetaLine(pod);
  const description = pod.description?.trim();
  const isActive = Boolean(pod.is_active);

  return (
    <article className="goal-row-card">
      <div className="goal-row-card__main">
        <div className="goal-row-card__chips">
          <span className="goal-chip goal-chip--category">
            <span className="goal-chip__icon" aria-hidden="true">
              {category.icon}
            </span>
            <span>{category.label}</span>
          </span>

          <span
            className={`goal-status-chip ${
              isActive
                ? "goal-status-chip--active"
                : "goal-status-chip--inactive"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>

          <span className="goal-chip goal-chip--meta">
            {formatCount(pod.member_count, "member")}
          </span>

          <span className="goal-chip goal-chip--meta">
            {formatCount(pod.active_goal_count, "active goal")}
          </span>
        </div>

        <div className="goal-row-card__titleRow">
          <div className="goal-row-card__content">
            <h2 className="goal-row-card__title">{pod.name}</h2>

            <p
              className={`goal-row-card__motivation ${
                !description ? "goal-row-card__motivation--muted" : ""
              }`}
            >
              {description || "No description added yet."}
            </p>
          </div>

          <Link
            to={`/pods/${pod.id}`}
            className="btn secondary goal-row-card__desktopAction"
            aria-label={`Open pod ${pod.name}`}
          >
            Open Pod
          </Link>
        </div>

        {metaLine ? (
          <div className="goal-row-card__summary goal-row-card__summary--muted">
            {metaLine}
          </div>
        ) : null}

        <div className="goal-row-card__mobileAction">
          <Link
            to={`/pods/${pod.id}`}
            className="btn secondary"
            aria-label={`Open pod ${pod.name}`}
          >
            Open Pod
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function PodsPage() {
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPods() {
      try {
        setLoading(true);
        setError("");

        const response = await authFetch("pods/");
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data?.detail || `Failed to load pods (${response.status})`
          );
        }

        setPods(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Something went wrong while loading pods.");
      } finally {
        setLoading(false);
      }
    }

    fetchPods();
  }, []);

  const hasPods = !loading && !error && pods.length > 0;

  return (
    <section className="page-shell goals-page pods-page">
      <div className="goals-intro-panel">
        <div className="goals-intro">
          <h1>Pods</h1>
          <p>
            Create and manage shared accountability pods where members can work
            toward goals together, submit check-ins, and support each other.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="goals-state-card">
          <p>Loading pods...</p>
        </div>
      ) : null}

      {error ? (
        <div className="goals-state-card goals-state-card--error">
          <p>{error}</p>
        </div>
      ) : null}

      {!loading && !error && pods.length === 0 ? (
        <div className="goals-empty-card">
          <div className="goals-empty-card__icon" aria-hidden="true">
            👥
          </div>
          <h2>No pods yet</h2>
          <p>
            Create your first pod to start building a shared accountability
            space for group goals, check-ins, and encouragement.
          </p>
          <Link to="/pods/new" className="btn primary">
            Create your first pod
          </Link>
        </div>
      ) : null}

      {hasPods ? (
        <section className="goals-list-panel">
          <div className="goals-list-panel__header">
            <div>
              <h2>My Pods</h2>
              <p className="goals-list-panel__subtext">
                Open a pod to view members, create pod goals, and manage shared
                progress.
              </p>
            </div>
          </div>

          <div className="goals-list">
            {pods.map((pod) => (
              <PodRow key={pod.id} pod={pod} />
            ))}
          </div>

          <div className="goals-list-panel__footer">
            <div className="goals-list-panel__total">
              Showing {pods.length} pod{pods.length === 1 ? "" : "s"}
            </div>

            <Link to="/pods/new" className="btn primary">
              Create Pod
            </Link>
          </div>
        </section>
      ) : null}
    </section>
  );
}