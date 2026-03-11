import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { authFetch } from "../api/auth-fetch";
import FormDropdown from "../components/FormDropdown";
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

const statusFilterOptions = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "PLANNED", label: "Planned" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
];

function formatStatus(status) {
  if (!status) return "Unknown";

  return status
    .toString()
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getGoalStatusTone(status) {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "PLANNED":
      return "planned";
    case "PAUSED":
      return "paused";
    case "COMPLETED":
      return "completed";
    case "ARCHIVED":
      return "archived";
    default:
      return "inactive";
  }
}

function CategoryChip({ category }) {
  const item = categoryMap[category] || categoryMap.OTHER;

  return (
    <span className="goal-chip">
      <span className="goal-chip__icon" aria-hidden="true">
        {item.icon}
      </span>
      <span>{item.label}</span>
    </span>
  );
}

function StatusChip({ status }) {
  return (
    <span className={`goal-status-chip goal-status-chip--${getGoalStatusTone(status)}`}>
      {formatStatus(status)}
    </span>
  );
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

function formatTrackingSummary(goal) {
  const frequency = goal.period === "DAILY" ? "daily" : "weekly";

  if (goal.metric_type === "BINARY") {
    return `Complete ${frequency}`;
  }

  if (goal.metric_type === "DURATION") {
    const minutes = Number(goal.target_value) || 0;

    if (minutes >= 60 && minutes % 60 === 0) {
      const hours = minutes / 60;
      return `${hours} ${hours === 1 ? "hour" : "hours"} ${frequency}`;
    }

    return `${minutes} min ${frequency}`;
  }

  if (goal.metric_type === "COUNT") {
    const unit = formatUnitLabel(goal.unit_label, goal.target_value);
    return `${goal.target_value} ${unit} ${frequency}`;
  }

  return `Tracked ${frequency}`;
}

function formatShortDate(dateString) {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}

function formatCompactDateRange(startDate, endDate) {
  const start = formatShortDate(startDate);
  const end = formatShortDate(endDate);

  if (start && end) return `${start} to ${end}`;
  if (start) return `Starts ${start}`;
  if (end) return `Ends ${end}`;
  return null;
}

function formatGoalSummary(goal) {
  const tracking = formatTrackingSummary(goal);
  const dateRange = formatCompactDateRange(goal.start_date, goal.end_date);

  if (tracking && dateRange) {
    return `${tracking} • ${dateRange}`;
  }

  return tracking || dateRange || "No summary yet";
}

function GoalRow({ goal }) {
  return (
    <article className="goal-row-card">
      <div className="goal-row-card__main">
        <div className="goal-row-card__chips">
          <CategoryChip category={goal.category} />
          <StatusChip status={goal.status} />
        </div>

        <div className="goal-row-card__titleRow">
          <div className="goal-row-card__content">
            <h2 className="goal-row-card__title">{goal.title}</h2>

            <p
              className={`goal-row-card__motivation ${
                !goal.motivation ? "goal-row-card__motivation--muted" : ""
              }`}
            >
              {goal.motivation || "No motivation added yet."}
            </p>
          </div>

          <Link
            to={`/goals/${goal.id}`}
            className="btn secondary goal-row-card__desktopAction"
          >
            View Goal
          </Link>
        </div>

        <div className="goal-row-card__summary">{formatGoalSummary(goal)}</div>

        <div className="goal-row-card__mobileAction">
          <Link to={`/goals/${goal.id}`} className="btn secondary">
            View Goal
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchGoals() {
      try {
        setLoading(true);
        setError("");

        const response = await authFetch("goals/");
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.detail || `Failed to load goals (${response.status})`);
        }

        setGoals(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Something went wrong while loading goals.");
      } finally {
        setLoading(false);
      }
    }

    fetchGoals();
  }, []);

  const filteredGoals = useMemo(() => {
    if (statusFilter === "ALL") return goals;
    return goals.filter((goal) => goal.status === statusFilter);
  }, [goals, statusFilter]);

  const hasGoals = !loading && !error && goals.length > 0;
  const hasFilteredGoals = !loading && !error && filteredGoals.length > 0;

  return (
    <section className="page-shell goals-page">
      <div className="goals-intro-panel">
        <div className="goals-intro">
          <h1>Goals</h1>
          <p>
            Your personal goals live here. Pick one to view details, track
            progress, or check in.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="goals-state-card">
          <p>Loading goals...</p>
        </div>
      ) : null}

      {error ? (
        <div className="goals-state-card goals-state-card--error">
          <p>{error}</p>
        </div>
      ) : null}

      {!loading && !error && goals.length === 0 ? (
        <div className="goals-empty-card">
          <div className="goals-empty-card__icon" aria-hidden="true">
            🎯
          </div>
          <h2>No goals yet</h2>
          <p>
            Create your first goal to start tracking progress and checking in
            with your accountability buddy.
          </p>
          <Link to="/goals/new" className="btn primary">
            Create your first goal
          </Link>
        </div>
      ) : null}

      {hasGoals ? (
        <section className="goals-list-panel">
          <div className="goals-list-panel__header">
            <div>
              <h2>Your goals</h2>
              <p className="goals-list-panel__subtext">
                Filter by status or open a goal to manage check-ins, buddies, and progress.
              </p>
            </div>

            <div className="goals-list-panel__controls">
              <div className="goals-filter">
                <span className="goals-filter__label">Status</span>
                <FormDropdown
                  value={statusFilter}
                  options={statusFilterOptions}
                  onChange={setStatusFilter}
                />
              </div>
            </div>
          </div>

          {hasFilteredGoals ? (
            <div className="goals-list">
              {filteredGoals.map((goal) => (
                <GoalRow key={goal.id} goal={goal} />
              ))}
            </div>
          ) : (
            <div className="goals-state-card">
              <p>No goals match that status yet.</p>
            </div>
          )}

          <div className="goals-list-panel__footer">
            <div className="goals-list-panel__total">
              Showing {filteredGoals.length} of {goals.length}
            </div>

            <Link to="/goals/new" className="btn primary">
              Create Goal
            </Link>
          </div>
        </section>
      ) : null}
    </section>
  );
}