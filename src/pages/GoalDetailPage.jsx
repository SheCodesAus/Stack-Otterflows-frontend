import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { authFetch } from "../api/auth-fetch";
import getCurrentUser from "../api/getCurrentUser";
import FormDropdown from "../components/FormDropdown";
import "./GoalDetailPage.css";

const DEFAULT_COMMENT_KIND = "COMMENT";

const COMMENT_KIND_OPTIONS = [
  { value: "COMMENT", label: "Comment" },
  { value: "KUDOS", label: "Kudos" },
  { value: "CLARIFY", label: "Clarify" },
];

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

function formatShortDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
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

function startOfToday(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfWeek(date) {
  const next = startOfToday(date);
  const dayIndex = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - dayIndex);
  return next;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isInCurrentPeriod(period, value) {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();

  if (period === "DAILY") {
    const start = startOfToday(now);
    const end = addDays(start, 1);
    return date >= start && date < end;
  }

  const start = startOfWeek(now);
  const end = addDays(start, 7);
  return date >= start && date < end;
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

function formatFrequency(period) {
  return period === "DAILY" ? "Daily" : "Weekly";
}

function formatTrackingLabel(metricType) {
  if (metricType === "BINARY") return "Done / not done";
  if (metricType === "COUNT") return "Number of times";
  if (metricType === "DURATION") return "Amount of time";
  return "Tracking";
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

function formatHeroSummary(goal) {
  const category = categoryMap[goal.category] || categoryMap.OTHER;
  return `${category.label} • ${formatFrequency(goal.period)} • Goal target: ${formatTarget(
    goal
  )}`;
}

function formatCheckInValue(goal, checkin) {
  if (goal.metric_type === "BINARY") {
    return "Done";
  }

  if (goal.metric_type === "DURATION") {
    const minutes = Number(checkin.value) || 0;

    if (minutes >= 60 && minutes % 60 === 0) {
      const hours = minutes / 60;
      return `${hours} ${hours === 1 ? "hour" : "hours"}`;
    }

    return `${minutes} minutes`;
  }

  const value = Number(checkin.value) || 0;
  const unit = formatUnitLabel(goal.unit_label, value);
  return `${value} ${unit}`;
}

function formatStatus(status) {
  if (!status) return "Unknown";

  return status
    .toString()
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCommentKind(kind) {
  if (!kind) return "Comment";

  switch (kind) {
    case "COMMENT":
      return "Comment";
    case "KUDOS":
      return "Kudos";
    case "CLARIFY":
      return "Clarify";
    default:
      return kind;
  }
}

function getAssignmentTone(status) {
  switch (status) {
    case "ACCEPTED":
      return "approved";
    case "PENDING":
      return "pending";
    case "DECLINED":
      return "rejected";
    default:
      return "inactive";
  }
}

function getGoalStatusTone(status) {
  switch (status) {
    case "PLANNED":
      return "planned";
    case "ACTIVE":
      return "active";
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

function formatDurationValue(minutes) {
  const value = Number(minutes) || 0;

  if (value >= 60 && value % 60 === 0) {
    const hours = value / 60;
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  return `${value} minute${value === 1 ? "" : "s"}`;
}

function getProgressMeasureText(goal, completedValue) {
  const currentPeriodLabel = goal.period === "DAILY" ? "today" : "this week";

  if (goal.status === "PLANNED") {
    return goal.start_date
      ? `This goal is planned and starts ${formatDate(goal.start_date)}.`
      : "This goal is planned and has not started yet.";
  }

  if (goal.status === "PAUSED") {
    return "This goal is currently paused.";
  }

  if (goal.status === "COMPLETED") {
    return "This goal has been marked complete.";
  }

  if (goal.status === "ARCHIVED") {
    return "This goal has been archived.";
  }

  if (goal.metric_type === "BINARY") {
    return completedValue >= 1
      ? `Completed ${currentPeriodLabel}.`
      : `Not completed yet ${currentPeriodLabel}.`;
  }

  if (goal.metric_type === "DURATION") {
    return `${formatDurationValue(completedValue)} of ${formatDurationValue(
      goal.target_value
    )} ${currentPeriodLabel}.`;
  }

  const unit = formatUnitLabel(goal.unit_label, goal.target_value);
  return `${completedValue} of ${goal.target_value} ${unit} ${currentPeriodLabel}.`;
}

function getProgressSupportText(goal) {
  if (goal.status === "PLANNED") return "It will become active once you’re ready to start.";
  if (goal.status === "PAUSED") return "You can reactivate it later from Edit Goal.";
  if (goal.status === "COMPLETED") return "You can still view the history and comments here.";
  if (goal.status === "ARCHIVED") return "Archived goals stay here for reference.";
  return `Target: ${formatTarget(goal)}`;
}

function getCommentPlaceholder(kind) {
  switch (kind) {
    case "KUDOS":
      return "Add encouragement or celebrate a win...";
    case "CLARIFY":
      return "Ask a question or request more detail...";
    default:
      return "Add encouragement, context, or feedback...";
  }
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

function StatusPill({ children, tone = "inactive" }) {
  return (
    <span className={`goal-status-pill goal-status-pill--${tone}`}>{children}</span>
  );
}

export default function GoalDetailPage() {
  const { goalId } = useParams();

  const [goal, setGoal] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [connections, setConnections] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedBuddyId, setSelectedBuddyId] = useState("");
  const [assigningBuddy, setAssigningBuddy] = useState(false);

  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [checkInValue, setCheckInValue] = useState("1");
  const [checkInNote, setCheckInNote] = useState("");
  const [checkInDate, setCheckInDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);

  const [commentKind, setCommentKind] = useState(DEFAULT_COMMENT_KIND);
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        setError("");

        const [currentUserData, goalResponse] = await Promise.all([
          getCurrentUser().catch(() => null),
          authFetch(`goals/${goalId}/`),
        ]);

        setCurrentUser(currentUserData);

        const goalData = await goalResponse.json().catch(() => ({}));

        if (!goalResponse.ok) {
          throw new Error(
            goalData?.detail || `Failed to load goal detail (${goalResponse.status})`
          );
        }

        setGoal(goalData);
      } catch (err) {
        setError(err.message || "Something went wrong while loading the goal.");
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [goalId]);

  useEffect(() => {
    if (!goal) return;

    if (goal.metric_type === "BINARY") {
      setCheckInValue("1");
    } else {
      setCheckInValue(String(goal.target_value || 1));
    }
  }, [goal]);

  const isOwner = useMemo(() => {
    if (!goal || !currentUser) return false;

    return (
      currentUser.id === goal.owner ||
      currentUser.username === goal.owner_username ||
      currentUser.display_name === goal.owner_display_name
    );
  }, [goal, currentUser]);

  useEffect(() => {
    async function loadConnections() {
      if (!isOwner || !showAssignForm) return;

      try {
        const response = await authFetch("connections/");
        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(data?.detail || "Failed to load connections.");
        }

        setConnections(Array.isArray(data) ? data : []);
      } catch (err) {
        setActionError(err.message || "Failed to load connections.");
      }
    }

    loadConnections();
  }, [isOwner, showAssignForm]);

  const sortedCheckins = useMemo(() => {
    if (!goal?.checkins) return [];

    return [...goal.checkins].sort((a, b) => {
      const aDate = new Date(a.period_start || a.created_at).getTime();
      const bDate = new Date(b.period_start || b.created_at).getTime();
      return bDate - aDate;
    });
  }, [goal]);

  const sortedAssignments = useMemo(() => {
    if (!goal?.assignments) return [];

    return [...goal.assignments].sort((a, b) => {
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      return bDate - aDate;
    });
  }, [goal]);

  const sortedComments = useMemo(() => {
    if (!goal?.comments) return [];

    return [...goal.comments].sort((a, b) => {
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      return bDate - aDate;
    });
  }, [goal]);

  const currentPeriodCheckins = useMemo(() => {
    if (!goal) return [];
    return sortedCheckins.filter((checkin) =>
      isInCurrentPeriod(goal.period, checkin.period_start || checkin.created_at)
    );
  }, [goal, sortedCheckins]);

  const pendingCheckins = useMemo(
    () => sortedCheckins.filter((checkin) => checkin.status === "PENDING"),
    [sortedCheckins]
  );

  const approvedCheckins = useMemo(
    () => sortedCheckins.filter((checkin) => checkin.status === "APPROVED"),
    [sortedCheckins]
  );

  const rejectedCheckins = useMemo(
    () => sortedCheckins.filter((checkin) => checkin.status === "REJECTED"),
    [sortedCheckins]
  );

  const currentPeriodPending = useMemo(
    () => currentPeriodCheckins.filter((checkin) => checkin.status === "PENDING"),
    [currentPeriodCheckins]
  );

  const currentPeriodApproved = useMemo(
    () => currentPeriodCheckins.filter((checkin) => checkin.status === "APPROVED"),
    [currentPeriodCheckins]
  );

  const currentPeriodRejected = useMemo(
    () => currentPeriodCheckins.filter((checkin) => checkin.status === "REJECTED"),
    [currentPeriodCheckins]
  );

  const acceptedBuddyIds = useMemo(() => {
    return sortedAssignments
      .filter((assignment) => assignment.consent_status === "ACCEPTED")
      .map((assignment) => assignment.buddy);
  }, [sortedAssignments]);

  const canVerifyCheckins = useMemo(() => {
    if (!currentUser) return false;
    return acceptedBuddyIds.includes(currentUser.id);
  }, [acceptedBuddyIds, currentUser]);

  const availableConnections = useMemo(() => {
    if (!currentUser || !goal) return [];

    const assignedBuddyIds = new Set(sortedAssignments.map((item) => item.buddy));

    return connections
      .filter((connection) => connection.status === "ACCEPTED")
      .map((connection) => {
        const isInviter = connection.inviter === currentUser.id;

        return {
          id: isInviter ? connection.invitee : connection.inviter,
          name:
            (isInviter
              ? connection.invitee_display_name || connection.invitee_username
              : connection.inviter_display_name || connection.inviter_username) ||
            "Unknown user",
        };
      })
      .filter((person) => person.id !== currentUser.id && !assignedBuddyIds.has(person.id));
  }, [connections, currentUser, goal, sortedAssignments]);

  const currentPeriodCompletedValue = useMemo(() => {
    if (!goal) return 0;

    if (goal.metric_type === "BINARY") {
      return currentPeriodCheckins.some((checkin) => checkin.status !== "REJECTED") ? 1 : 0;
    }

    return currentPeriodCheckins
      .filter((checkin) => checkin.status !== "REJECTED")
      .reduce((total, checkin) => total + (Number(checkin.value) || 0), 0);
  }, [goal, currentPeriodCheckins]);

  const progressTarget = Number(goal?.target_value) || 1;
  const progressPercent = Math.max(
    0,
    Math.min(100, Math.round((currentPeriodCompletedValue / progressTarget) * 100))
  );

  const progressHeading = goal?.period === "DAILY" ? "Progress Today" : "Progress This Week";

  const ownerName = useMemo(() => {
    if (!goal) return "";
    return goal.owner_display_name || goal.owner_username || "Unknown";
  }, [goal]);

  async function refreshGoalDetail() {
    const response = await authFetch(`goals/${goalId}/`);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.detail || "Failed to refresh goal.");
    }

    setGoal(data);
  }

  async function handleApprove(checkinId) {
    try {
      setActionError("");
      setActionSuccess("");

      const response = await authFetch(`checkins/${checkinId}/approve/`, {
        method: "POST",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to approve check-in.");
      }

      setActionSuccess("Check-in approved.");
      await refreshGoalDetail();
    } catch (err) {
      setActionError(err.message || "Failed to approve check-in.");
    }
  }

  async function handleReject(checkinId) {
    const reason = window.prompt("Add a reason for rejecting this check-in:", "");

    if (reason === null) return;

    try {
      setActionError("");
      setActionSuccess("");

      const response = await authFetch(`checkins/${checkinId}/reject/`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to reject check-in.");
      }

      setActionSuccess("Check-in rejected.");
      await refreshGoalDetail();
    } catch (err) {
      setActionError(err.message || "Failed to reject check-in.");
    }
  }

  async function handleAssignBuddy(event) {
    event.preventDefault();

    if (!selectedBuddyId) {
      setActionError("Please choose a buddy.");
      return;
    }

    try {
      setAssigningBuddy(true);
      setActionError("");
      setActionSuccess("");

      const response = await authFetch("goal-assignments/", {
        method: "POST",
        body: JSON.stringify({
          goal: goal.id,
          buddy: Number(selectedBuddyId),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to assign buddy.");
      }

      setSelectedBuddyId("");
      setShowAssignForm(false);
      setActionSuccess("Buddy invitation sent.");
      await refreshGoalDetail();
    } catch (err) {
      setActionError(err.message || "Failed to assign buddy.");
    } finally {
      setAssigningBuddy(false);
    }
  }

  async function handleSubmitCheckIn(event) {
    event.preventDefault();

    const value = goal.metric_type === "BINARY" ? 1 : Number(checkInValue);

    if (!checkInDate) {
      setActionError("Please choose a date for the check-in.");
      return;
    }

    if (!Number.isFinite(value) || value < 1) {
      setActionError("Please enter a value greater than 0.");
      return;
    }

    try {
      setSubmittingCheckIn(true);
      setActionError("");
      setActionSuccess("");

      const response = await authFetch("checkins/", {
        method: "POST",
        body: JSON.stringify({
          goal: goal.id,
          period_start: checkInDate,
          value,
          note: checkInNote.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const firstEntry = Object.entries(data)[0];

        if (firstEntry) {
          const [field, messages] = firstEntry;
          const message = Array.isArray(messages) ? messages[0] : messages;
          throw new Error(`${field}: ${message}`);
        }

        throw new Error(data?.detail || "Failed to create check-in.");
      }

      setCheckInNote("");
      setShowCheckInForm(false);
      setActionSuccess("Check-in submitted.");
      await refreshGoalDetail();
    } catch (err) {
      setActionError(err.message || "Failed to create check-in.");
    } finally {
      setSubmittingCheckIn(false);
    }
  }

  async function handleSubmitComment(event) {
    event.preventDefault();

    if (!commentBody.trim()) {
      setActionError("Please write a comment first.");
      return;
    }

    try {
      setSubmittingComment(true);
      setActionError("");
      setActionSuccess("");

      const response = await authFetch("comments/", {
        method: "POST",
        body: JSON.stringify({
          goal: goal.id,
          kind: commentKind,
          body: commentBody.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const firstEntry = Object.entries(data)[0];

        if (firstEntry) {
          const [field, messages] = firstEntry;
          const message = Array.isArray(messages) ? messages[0] : messages;
          throw new Error(`${field}: ${message}`);
        }

        throw new Error(data?.detail || "Failed to post comment.");
      }

      setCommentBody("");
      setCommentKind(DEFAULT_COMMENT_KIND);
      setActionSuccess("Comment posted.");
      await refreshGoalDetail();
    } catch (err) {
      setActionError(err.message || "Failed to post comment.");
    } finally {
      setSubmittingComment(false);
    }
  }

  if (loading) {
    return (
      <section className="page-shell goal-detail-page">
        <div className="goal-detail-topbar">
          <Link to="/goals" className="goal-detail-backlink">
            <span aria-hidden="true">←</span>
            <span>Back to Goals</span>
          </Link>
        </div>
        <p>Loading goal detail...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-shell goal-detail-page">
        <div className="goal-detail-topbar">
          <Link to="/goals" className="goal-detail-backlink">
            <span aria-hidden="true">←</span>
            <span>Back to Goals</span>
          </Link>
        </div>
        <p>{error}</p>
      </section>
    );
  }

  if (!goal) {
    return (
      <section className="page-shell goal-detail-page">
        <div className="goal-detail-topbar">
          <Link to="/goals" className="goal-detail-backlink">
            <span aria-hidden="true">←</span>
            <span>Back to Goals</span>
          </Link>
        </div>
        <p>Goal not found.</p>
      </section>
    );
  }

  return (
    <section className="page-shell goal-detail-page">
      <div className="goal-detail-topbar">
        <Link to="/goals" className="goal-detail-backlink">
          <span aria-hidden="true">←</span>
          <span>Back to Goals</span>
        </Link>
      </div>

      <header className="goal-detail-hero">
        <div className="goal-detail-hero__main">
          <div className="goal-detail-hero__meta">
            <CategoryChip category={goal.category} />
            <StatusPill tone={getGoalStatusTone(goal.status)}>
              {formatStatus(goal.status)}
            </StatusPill>
          </div>

          <h1>{goal.title}</h1>
          <p className="goal-detail-hero__summary">{formatHeroSummary(goal)}</p>
          <p className="goal-detail-hero__motivation">
            {goal.motivation || "No motivation added yet."}
          </p>

          {isOwner ? (
            <div className="goal-detail-hero__actions">
              <Link to={`/goals/${goal.id}/edit`} className="btn secondary">
                Edit Goal
              </Link>

              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  setShowCheckInForm((current) => !current);
                  setShowAssignForm(false);
                }}
              >
                {showCheckInForm ? "Close Check-In" : "Add Check-In"}
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {actionError ? (
        <p className="goal-detail-feedback goal-detail-feedback--error">
          {actionError}
        </p>
      ) : null}

      {actionSuccess ? (
        <p className="goal-detail-feedback goal-detail-feedback--success">
          {actionSuccess}
        </p>
      ) : null}

      {showCheckInForm ? (
        <section className="goal-card">
          <div className="goal-card__header">
            <h2>Add Check-In</h2>
          </div>

          <form className="goal-inline-form" onSubmit={handleSubmitCheckIn}>
            <div className="goal-inline-form__grid">
              <div className="goal-inline-field">
                <label htmlFor="checkin-date">Date</label>
                <input
                  id="checkin-date"
                  type="date"
                  value={checkInDate}
                  onChange={(event) => setCheckInDate(event.target.value)}
                  required
                />
              </div>

              {goal.metric_type !== "BINARY" ? (
                <div className="goal-inline-field">
                  <label htmlFor="checkin-value">Value</label>
                  <input
                    id="checkin-value"
                    type="number"
                    min="1"
                    step="1"
                    value={checkInValue}
                    onChange={(event) => setCheckInValue(event.target.value)}
                    required
                  />
                </div>
              ) : null}

              <div className="goal-inline-field goal-inline-field--full">
                <label htmlFor="checkin-note">Note</label>
                <textarea
                  id="checkin-note"
                  rows="4"
                  value={checkInNote}
                  onChange={(event) => setCheckInNote(event.target.value)}
                  placeholder="Add a quick note about what you completed."
                />
              </div>
            </div>

            <div className="goal-inline-form__actions">
              <button type="submit" className="btn primary" disabled={submittingCheckIn}>
                {submittingCheckIn ? "Submitting..." : "Submit Check-In"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {showAssignForm ? (
        <section className="goal-card">
          <div className="goal-card__header">
            <h2>Assign Buddy</h2>
          </div>

          {availableConnections.length ? (
            <form className="goal-inline-form" onSubmit={handleAssignBuddy}>
              <div className="goal-inline-form__grid">
                <div className="goal-inline-field goal-inline-field--full">
                  <label htmlFor="buddy-select">Choose a buddy</label>
                  <select
                    id="buddy-select"
                    value={selectedBuddyId}
                    onChange={(event) => setSelectedBuddyId(event.target.value)}
                    required
                  >
                    <option value="">Select a connection</option>
                    {availableConnections.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="goal-inline-form__actions">
                <button type="submit" className="btn primary" disabled={assigningBuddy}>
                  {assigningBuddy ? "Sending..." : "Send Buddy Invite"}
                </button>
              </div>
            </form>
          ) : (
            <p className="goal-empty-text">
              No available accepted connections to assign right now.
            </p>
          )}
        </section>
      ) : null}

      <section className="goal-detail-grid">
        <div className="goal-detail-main">
          <article className="goal-card goal-card--progress">
            <div className="goal-card__header">
              <h2>{progressHeading}</h2>
            </div>

            <div className="goal-progress">
              <div className="goal-progress__topline">
                <strong>{getProgressMeasureText(goal, currentPeriodCompletedValue)}</strong>
              </div>

              <div
                className="goal-progress__bar"
                aria-label={`${progressPercent}% complete`}
              >
                <span
                  className="goal-progress__fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="goal-progress__footer">
                <span>{getProgressSupportText(goal)}</span>
                <strong>{progressPercent}%</strong>
              </div>
            </div>
          </article>

          <article className="goal-card">
            <div className="goal-card__header">
              <h2>Pending Verification ({pendingCheckins.length})</h2>
            </div>

            {pendingCheckins.length ? (
              <div className="goal-checkin-list">
                {pendingCheckins.map((checkin) => (
                  <div key={checkin.id} className="goal-checkin-row">
                    <div className="goal-checkin-row__content">
                      <div className="goal-checkin-row__top">
                        <strong>{formatDate(checkin.period_start || checkin.created_at)}</strong>
                        <StatusPill tone="pending">Pending</StatusPill>
                      </div>

                      <p>
                        <span className="goal-checkin-label">Value:</span>{" "}
                        {formatCheckInValue(goal, checkin)}
                      </p>

                      {checkin.note ? <p>{checkin.note}</p> : null}

                      <p>
                        <span className="goal-checkin-label">Submitted by:</span>{" "}
                        {checkin.created_by_display_name ||
                          checkin.created_by_username ||
                          `User ${checkin.created_by}`}
                      </p>
                    </div>

                    {canVerifyCheckins ? (
                      <div className="goal-checkin-row__actions">
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() => handleApprove(checkin.id)}
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          className="btn ghost-danger"
                          onClick={() => handleReject(checkin.id)}
                        >
                          Reject
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="goal-empty-text">No pending check-ins right now.</p>
            )}
          </article>

          <article className="goal-card">
            <div className="goal-card__header">
              <h2>Approved ({approvedCheckins.length})</h2>
            </div>

            {approvedCheckins.length ? (
              <div className="goal-checkin-list">
                {approvedCheckins.map((checkin) => (
                  <div key={checkin.id} className="goal-checkin-row">
                    <div className="goal-checkin-row__content">
                      <div className="goal-checkin-row__top">
                        <strong>{formatDate(checkin.period_start || checkin.created_at)}</strong>
                        <StatusPill tone="approved">Approved</StatusPill>
                      </div>

                      <p>
                        <span className="goal-checkin-label">Value:</span>{" "}
                        {formatCheckInValue(goal, checkin)}
                      </p>

                      {checkin.note ? <p>{checkin.note}</p> : null}

                      {checkin.verified_at ? (
                        <p>
                          <span className="goal-checkin-label">Verified:</span>{" "}
                          {checkin.verified_by_display_name ||
                            checkin.verified_by_username ||
                            "Buddy"}{" "}
                          on {formatDateTime(checkin.verified_at)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="goal-empty-text">No approved check-ins yet.</p>
            )}
          </article>

          <article className="goal-card">
            <div className="goal-card__header">
              <h2>Rejected / Needs Clarification ({rejectedCheckins.length})</h2>
            </div>

            {rejectedCheckins.length ? (
              <div className="goal-checkin-list">
                {rejectedCheckins.map((checkin) => (
                  <div key={checkin.id} className="goal-checkin-row">
                    <div className="goal-checkin-row__content">
                      <div className="goal-checkin-row__top">
                        <strong>{formatDate(checkin.period_start || checkin.created_at)}</strong>
                        <StatusPill tone="rejected">Rejected</StatusPill>
                      </div>

                      <p>
                        <span className="goal-checkin-label">Value:</span>{" "}
                        {formatCheckInValue(goal, checkin)}
                      </p>

                      {checkin.note ? <p>{checkin.note}</p> : null}

                      {checkin.rejection_reason ? (
                        <p className="goal-checkin-reason">
                          <span className="goal-checkin-label">Reason:</span>{" "}
                          {checkin.rejection_reason}
                        </p>
                      ) : null}

                      {checkin.verified_at ? (
                        <p>
                          <span className="goal-checkin-label">Reviewed:</span>{" "}
                          {checkin.verified_by_display_name ||
                            checkin.verified_by_username ||
                            "Buddy"}{" "}
                          on {formatDateTime(checkin.verified_at)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="goal-empty-text">No rejected check-ins.</p>
            )}
          </article>
        </div>

        <aside className="goal-detail-side">
          <article className="goal-card">
            <div className="goal-card__header">
              <h2>Accountability</h2>
            </div>

            {sortedAssignments.length ? (
              <div className="goal-assignment-list">
                {sortedAssignments.map((assignment) => (
                  <div key={assignment.id} className="goal-assignment-row">
                    <div>
                      <strong>
                        {assignment.buddy_display_name ||
                          assignment.buddy_username ||
                          `User ${assignment.buddy}`}
                      </strong>
                    </div>

                    <StatusPill tone={getAssignmentTone(assignment.consent_status)}>
                      {formatStatus(assignment.consent_status)}
                    </StatusPill>
                  </div>
                ))}
              </div>
            ) : (
              <p className="goal-empty-text">
                No buddy assigned yet. Assign a buddy to enable verification for your
                check-ins.
              </p>
            )}

            {isOwner ? (
              <div className="goal-card__footerAction">
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    setShowAssignForm((current) => !current);
                    setShowCheckInForm(false);
                  }}
                >
                  {showAssignForm ? "Close Assign Buddy" : "Assign Buddy"}
                </button>
              </div>
            ) : null}
          </article>

          <article className="goal-card">
            <div className="goal-card__header">
              <h2>This Period Totals</h2>
            </div>

            <div className="goal-totals-list">
              <div className="goal-totals-row">
                <span>Pending</span>
                <strong>{currentPeriodPending.length}</strong>
              </div>
              <div className="goal-totals-row">
                <span>Approved</span>
                <strong>{currentPeriodApproved.length}</strong>
              </div>
              <div className="goal-totals-row">
                <span>Rejected</span>
                <strong>{currentPeriodRejected.length}</strong>
              </div>
              <div className="goal-totals-row">
                <span>Total submitted</span>
                <strong>{currentPeriodCheckins.length}</strong>
              </div>
            </div>

            <p className="goal-side-note">
              Pending check-ins appear here until a buddy reviews them.
            </p>
          </article>

          <article className="goal-card">
            <div className="goal-card__header">
              <h2>Goal Details</h2>
            </div>

            <div className="goal-summary-list">
              <div className="goal-summary-row">
                <span>Owner</span>
                <strong>{ownerName}</strong>
              </div>

              <div className="goal-summary-row">
                <span>Status</span>
                <strong>{formatStatus(goal.status)}</strong>
              </div>

              <div className="goal-summary-row">
                <span>How you’re tracking it</span>
                <strong>{formatTrackingLabel(goal.metric_type)}</strong>
              </div>

              <div className="goal-summary-row">
                <span>Frequency</span>
                <strong>{formatFrequency(goal.period)}</strong>
              </div>

              <div className="goal-summary-row">
                <span>Goal target</span>
                <strong>{formatTarget(goal)}</strong>
              </div>

              <div className="goal-summary-row">
                <span>Start date</span>
                <strong>{formatDate(goal.start_date)}</strong>
              </div>

              <div className="goal-summary-row">
                <span>End date</span>
                <strong>{formatDate(goal.end_date)}</strong>
              </div>

              <div className="goal-summary-row">
                <span>Created</span>
                <strong>{formatDate(goal.created_at)}</strong>
              </div>
            </div>
          </article>
        </aside>
      </section>

      <article className="goal-card goal-card--comments">
        <div className="goal-card__header">
          <h2>Comments</h2>
        </div>

        {sortedComments.length ? (
          <div className="goal-comment-list">
            {sortedComments.map((comment) => (
              <div key={comment.id} className="goal-comment">
                <div className="goal-comment__top">
                  <strong>
                    {comment.author_display_name ||
                      comment.author_username ||
                      `User ${comment.author}`}
                  </strong>
                  <span className="goal-comment__kind">
                    {formatCommentKind(comment.kind)}
                  </span>
                  <span className="goal-comment__date">
                    {formatShortDate(comment.created_at)}
                  </span>
                </div>
                <p>{comment.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="goal-empty-text">No comments yet.</p>
        )}

        <form className="goal-comment-form" onSubmit={handleSubmitComment}>
          <div className="goal-inline-form__grid">
            <div className="goal-inline-field goal-inline-field--full">
              <label>Comment type</label>
              <FormDropdown
                value={commentKind}
                options={COMMENT_KIND_OPTIONS}
                onChange={setCommentKind}
              />
            </div>

            <div className="goal-inline-field goal-inline-field--full">
              <label htmlFor="goal-comment-body">Add a comment</label>
              <textarea
                id="goal-comment-body"
                rows="4"
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value)}
                placeholder={getCommentPlaceholder(commentKind)}
              />
            </div>
          </div>

          <div className="goal-comment-form__actions">
            <button type="submit" className="btn primary" disabled={submittingComment}>
              {submittingComment ? "Posting..." : `Post ${formatCommentKind(commentKind)}`}
            </button>
          </div>
        </form>
      </article>
    </section>
  );
}