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

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

function getMediaUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path}`;
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
  const isDaily = goal.period === "DAILY";
  const currentPeriodLabel = isDaily ? "today" : "this week";

  if (goal.status === "PLANNED") {
    return goal.start_date
      ? `This goal starts ${formatDate(goal.start_date)}.`
      : "This goal has not started yet.";
  }

  if (goal.status === "PAUSED") {
    return "This goal is currently paused.";
  }

  if (goal.status === "COMPLETED") {
    return isDaily
      ? "Today's goal has been completed."
      : "This week's goal has been completed.";
  }

  if (goal.status === "ARCHIVED") {
    return "This goal has been archived.";
  }

  if (goal.metric_type === "BINARY") {
    return completedValue >= 1
      ? isDaily
        ? "Today's goal is complete."
        : "This week's goal is complete."
      : isDaily
      ? "Not completed yet today."
      : "Not completed yet this week.";
  }

  if (goal.metric_type === "DURATION") {
    return `${formatDurationValue(completedValue)} of ${formatDurationValue(
      goal.target_value
    )} completed ${currentPeriodLabel}.`;
  }

  const unit = formatUnitLabel(goal.unit_label, goal.target_value);
  return `${completedValue} of ${goal.target_value} ${unit} completed ${currentPeriodLabel}.`;
}

function getProgressSupportText(goal) {
  if (goal.status === "PLANNED") {
    return goal.start_date
      ? `Check-ins open on ${formatDate(goal.start_date)}.`
      : "Check-ins will open once this goal starts.";
  }

  if (goal.status === "PAUSED") {
    return "Progress is paused for now.";
  }

  if (goal.status === "COMPLETED") {
    return goal.period === "DAILY"
      ? "This card shows today's progress."
      : "This card shows this week's progress.";
  }

  if (goal.status === "ARCHIVED") {
    return "This card is kept for reference.";
  }

  return goal.period === "DAILY"
    ? "This card tracks today's progress."
    : "This card tracks this week's progress.";
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

function getCheckInValueLabel(goal) {
  if (!goal) return "Amount completed";

  if (goal.metric_type === "DURATION") {
    return "Minutes completed";
  }

  if (goal.metric_type === "COUNT") {
    const rawUnit = goal.unit_label?.trim();

    if (!rawUnit) {
      return "How many did you complete?";
    }

    const lowerUnit = rawUnit.toLowerCase();

    if (lowerUnit === "times" || lowerUnit === "time") {
      return "How many times did you complete it?";
    }

    return `How many ${lowerUnit} did you complete?`;
  }

  return "Amount completed";
}

function getCheckInValueHelper(goal) {
  if (!goal) return "";

  if (goal.metric_type === "BINARY") {
    const periodWord = goal.period === "DAILY" ? "day" : "week";
    return `This check-in marks the goal as completed for the selected ${periodWord}.`;
  }

  return `Target: ${formatTarget(goal)}`;
}

function getCheckInNotePlaceholder(goal) {
  if (!goal) return "Add a quick note about what you completed.";

  if (goal.metric_type === "DURATION") {
    return "Add a quick note about what you spent this time on.";
  }

  if (goal.metric_type === "COUNT") {
    return "Add a quick note about what you completed.";
  }

  return "Add a quick note about what you completed.";
}

function getDisplayName(primary, secondary, fallback = "Someone") {
  return primary || secondary || fallback;
}

function buildActivityFeed(goal) {
  if (!goal) return [];

  const items = [];

  (goal.assignments || []).forEach((assignment) => {
    const buddyName = getDisplayName(
      assignment.buddy_display_name,
      assignment.buddy_username,
      `User ${assignment.buddy}`
    );

    items.push({
      id: `assignment-created-${assignment.id}`,
      type: "assignment_created",
      timestamp: assignment.created_at,
      title: `${buddyName} was invited as accountability buddy`,
      meta: "Buddy invite sent",
    });

    if (assignment.consent_status === "ACCEPTED" && assignment.responded_at) {
      items.push({
        id: `assignment-accepted-${assignment.id}`,
        type: "assignment_accepted",
        timestamp: assignment.responded_at,
        title: `${buddyName} accepted the buddy request`,
        meta: "Buddy accepted",
      });
    }

    if (assignment.consent_status === "DECLINED" && assignment.responded_at) {
      items.push({
        id: `assignment-declined-${assignment.id}`,
        type: "assignment_declined",
        timestamp: assignment.responded_at,
        title: `${buddyName} declined the buddy request`,
        meta: "Buddy declined",
      });
    }
  });

  (goal.checkins || []).forEach((checkin) => {
    const createdBy = getDisplayName(
      checkin.created_by_display_name,
      checkin.created_by_username,
      `User ${checkin.created_by}`
    );

    items.push({
      id: `checkin-created-${checkin.id}`,
      type: "checkin_created",
      timestamp: checkin.created_at,
      title: `${createdBy} submitted a check-in`,
      meta: formatCheckInValue(goal, checkin),
      note: checkin.note || "",
      proof: getMediaUrl(checkin.proof_url || checkin.proof || ""),
    });

    if (checkin.status === "APPROVED" && checkin.verified_at) {
      const verifiedBy = getDisplayName(
        checkin.verified_by_display_name,
        checkin.verified_by_username,
        "Buddy"
      );

      items.push({
        id: `checkin-approved-${checkin.id}`,
        type: "checkin_approved",
        timestamp: checkin.verified_at,
        title: `${verifiedBy} approved a check-in`,
        meta: formatCheckInValue(goal, checkin),
      });
    }

    if (checkin.status === "REJECTED" && checkin.verified_at) {
      const verifiedBy = getDisplayName(
        checkin.verified_by_display_name,
        checkin.verified_by_username,
        "Buddy"
      );

      items.push({
        id: `checkin-rejected-${checkin.id}`,
        type: "checkin_rejected",
        timestamp: checkin.verified_at,
        title: `${verifiedBy} requested clarification on a check-in`,
        meta: checkin.rejection_reason || "Needs clarification",
      });
    }
  });

  return items.sort((a, b) => {
    const aTime = new Date(a.timestamp).getTime();
    const bTime = new Date(b.timestamp).getTime();
    return bTime - aTime;
  });
}

function getActivityTone(type) {
  switch (type) {
    case "assignment_accepted":
    case "checkin_approved":
      return "approved";
    case "assignment_declined":
    case "checkin_rejected":
      return "rejected";
    case "assignment_created":
    case "checkin_created":
      return "pending";
    default:
      return "inactive";
  }
}

function getActivityPillLabel(type) {
  switch (type) {
    case "assignment_created":
      return "Buddy Invite";
    case "assignment_accepted":
      return "Buddy Accepted";
    case "assignment_declined":
      return "Buddy Declined";
    case "checkin_created":
      return "Check-In";
    case "checkin_approved":
      return "Approved";
    case "checkin_rejected":
      return "Needs Clarification";
    default:
      return "Activity";
  }
}

function canAddCheckIn(goal) {
  if (!goal) {
    return { allowed: false, reason: "" };
  }

  const today = startOfToday(new Date());

if (goal.status === "PLANNED") {
  if (goal.start_date) {
    const startDate = startOfToday(goal.start_date);
    if (startDate > today) {
      return {
        allowed: false,
        reason: `Check-ins open on ${formatDate(goal.start_date)}.`,
      };
    }
  } else {
    return {
      allowed: false,
      reason: "This goal has not started yet.",
    };
  }
}

  if (goal.status === "PAUSED") {
    return {
      allowed: false,
      reason: "This goal is currently paused.",
    };
  }

  if (goal.status === "COMPLETED") {
    return {
      allowed: false,
      reason: "This goal has already been completed.",
    };
  }

  if (goal.status === "ARCHIVED") {
    return {
      allowed: false,
      reason: "This goal has been archived.",
    };
  }

  if (goal.start_date) {
    const startDate = startOfToday(goal.start_date);
    if (startDate > today) {
      return {
        allowed: false,
        reason: `Check-ins open on ${formatDate(goal.start_date)}.`,
      };
    }
  }

  if (goal.end_date) {
    const endDate = startOfToday(goal.end_date);
    if (endDate < today) {
      return {
        allowed: false,
        reason: "This goal has ended.",
      };
    }
  }

  return { allowed: true, reason: "" };
}

function getDisplayCurrentProgressPercent(goal, rawPercent) {
  if (!goal) return 0;

  if (goal.status === "PLANNED") return 0;
  if (goal.status === "PAUSED") return 0;
  if (goal.status === "ARCHIVED") return 0;
  if (goal.status === "COMPLETED") return 100;

  return rawPercent;
}

function getPeriodStartDate(value, period) {
  const date = startOfToday(value);

  if (period === "WEEKLY") {
    const dayIndex = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - dayIndex);
  }

  return date;
}

function getPeriodKey(value, period) {
  const date = getPeriodStartDate(value, period);
  return date.toISOString().slice(0, 10);
}

function getScheduledPeriods(goal) {
  if (!goal?.start_date) return [];

  const start = startOfToday(goal.start_date);
  const rawEnd = goal.end_date ? startOfToday(goal.end_date) : startOfToday(new Date());

  if (rawEnd < start) return [];

  const periods = [];
  const seen = new Set();

  for (
    let cursor = new Date(start);
    cursor <= rawEnd;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const key = getPeriodKey(cursor, goal.period);

    if (!seen.has(key)) {
      seen.add(key);
      periods.push(key);
    }
  }

  return periods;
}

function getQualifyingCheckins(checkins, mode = "approved") {
  if (mode === "approved") {
    return checkins.filter((checkin) => checkin.status === "APPROVED");
  }

  if (mode === "submitted") {
    return checkins.filter((checkin) => checkin.status !== "REJECTED");
  }

  return checkins;
}

function getOverallGoalProgress(goal, checkins, mode = "approved") {
  if (!goal) {
    return {
      scheduledPeriods: 0,
      completedValue: 0,
      targetValue: 0,
      percent: 0,
    };
  }

  const scheduledPeriods = getScheduledPeriods(goal);

  if (!scheduledPeriods.length) {
    return {
      scheduledPeriods: 0,
      completedValue: 0,
      targetValue: 0,
      percent: 0,
    };
  }

  const qualifyingCheckins = getQualifyingCheckins(checkins, mode);

  const grouped = qualifyingCheckins.reduce((acc, checkin) => {
    const key = getPeriodKey(checkin.period_start || checkin.created_at, goal.period);

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(checkin);
    return acc;
  }, {});

  let completedValue = 0;
  let targetValue = 0;

  scheduledPeriods.forEach((periodKey) => {
    const periodCheckins = grouped[periodKey] || [];

    if (goal.metric_type === "BINARY") {
      targetValue += 1;
      completedValue += periodCheckins.length > 0 ? 1 : 0;
      return;
    }

    const periodTotal = periodCheckins.reduce(
      (sum, checkin) => sum + (Number(checkin.value) || 0),
      0
    );

    const cappedTotal = Math.min(periodTotal, Number(goal.target_value) || 0);

    targetValue += Number(goal.target_value) || 0;
    completedValue += cappedTotal;
  });

  const percent =
    targetValue > 0 ? Math.round((completedValue / targetValue) * 100) : 0;

  return {
    scheduledPeriods: scheduledPeriods.length,
    completedValue,
    targetValue,
    percent: Math.max(0, Math.min(100, percent)),
  };
}

function getOverallProgressText(goal, overallProgress) {
  if (!goal) return "";

  if (goal.metric_type === "BINARY") {
    const periodUnit = goal.period === "DAILY" ? "days" : "weeks";
    return `${overallProgress.completedValue} of ${overallProgress.targetValue} ${periodUnit} completed.`;
  }

  if (goal.metric_type === "DURATION") {
    return `${formatDurationValue(overallProgress.completedValue)} of ${formatDurationValue(
      overallProgress.targetValue
    )} completed overall.`;
  }

  const unit = formatUnitLabel(goal.unit_label, overallProgress.targetValue);
  return `${overallProgress.completedValue} of ${overallProgress.targetValue} ${unit} completed overall.`;
}

function getOverallProgressSupportText(goal) {
  if (!goal) return "";

  if (goal.status === "PLANNED") {
    return goal.start_date
      ? `Goal starts ${formatDate(goal.start_date)}.`
      : "This goal has not started yet.";
  }

  return "This card tracks verified progress across the whole goal.";
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
  const [loadingConnections, setLoadingConnections] = useState(false);
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
  const [checkInProof, setCheckInProof] = useState(null);
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);

  const [commentKind, setCommentKind] = useState(DEFAULT_COMMENT_KIND);
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const [showAllActivity, setShowAllActivity] = useState(false);

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
        setShowAllActivity(false);
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
        setLoadingConnections(true);
        setActionError("");

        const response = await authFetch("connections/");
        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(data?.detail || "Failed to load connections.");
        }

        setConnections(Array.isArray(data) ? data : []);
      } catch (err) {
        setActionError(err.message || "Failed to load connections.");
      } finally {
        setLoadingConnections(false);
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

  const acceptedAssignments = useMemo(
    () => sortedAssignments.filter((assignment) => assignment.consent_status === "ACCEPTED"),
    [sortedAssignments]
  );

  const pendingAssignments = useMemo(
    () => sortedAssignments.filter((assignment) => assignment.consent_status === "PENDING"),
    [sortedAssignments]
  );

  const declinedAssignments = useMemo(
    () => sortedAssignments.filter((assignment) => assignment.consent_status === "DECLINED"),
    [sortedAssignments]
  );

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

  const activityFeed = useMemo(() => buildActivityFeed(goal), [goal]);

  const visibleActivityFeed = useMemo(() => {
    if (showAllActivity) return activityFeed;
    return activityFeed.slice(0, 6);
  }, [activityFeed, showAllActivity]);

  const acceptedBuddyIds = useMemo(() => {
    return acceptedAssignments.map((assignment) => assignment.buddy);
  }, [acceptedAssignments]);

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
      .filter((person) => person.id !== currentUser.id && !assignedBuddyIds.has(person.id))
      .sort((a, b) => a.name.localeCompare(b.name));
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

  const displayCurrentProgressPercent = getDisplayCurrentProgressPercent(
    goal,
    progressPercent
  );

  const overallProgress = useMemo(() => {
    return getOverallGoalProgress(goal, sortedCheckins, "approved");
  }, [goal, sortedCheckins]);

const progressHeading =
  goal?.period === "DAILY" ? "Today’s Progress" : "This Week’s Progress";

  const ownerName = useMemo(() => {
    if (!goal) return "";
    return goal.owner_display_name || goal.owner_username || "Unknown";
  }, [goal]);

  const hasAcceptedBuddy = acceptedAssignments.length > 0;
  const hasPendingBuddy = pendingAssignments.length > 0;

  const assignButtonLabel = hasAcceptedBuddy
    ? "Assign Another Buddy"
    : hasPendingBuddy
    ? "Invite Another Buddy"
    : "Assign Buddy";

  const checkInAvailability = useMemo(() => canAddCheckIn(goal), [goal]);

  function clearActionMessages() {
    setActionError("");
    setActionSuccess("");
  }

  function toggleCheckInForm() {
    if (!checkInAvailability.allowed) return;
    clearActionMessages();
    setShowCheckInForm((current) => !current);
    setShowAssignForm(false);
  }

  function toggleAssignForm() {
    clearActionMessages();
    setShowAssignForm((current) => {
      const next = !current;
      if (!next) {
        setSelectedBuddyId("");
      }
      return next;
    });
    setShowCheckInForm(false);
  }

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
      clearActionMessages();

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
      clearActionMessages();

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
      clearActionMessages();

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

    if (!checkInAvailability.allowed) {
      setActionError(checkInAvailability.reason || "Check-in unavailable.");
      return;
    }

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
      clearActionMessages();

      const formData = new FormData();
      formData.append("goal", String(goal.id));
      formData.append("period_start", checkInDate);
      formData.append("value", String(value));
      formData.append("note", checkInNote.trim());

      if (checkInProof) {
        console.log("checkInProof:", checkInProof);
        console.log("is File:", checkInProof instanceof File);
        console.log("name:", checkInProof?.name);
        formData.append("proof", checkInProof);
      }

      const response = await authFetch("checkins/", {
        method: "POST",
        body: formData,
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
      setCheckInProof(null);
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
      clearActionMessages();

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
            <>
              <div className="goal-detail-hero__actions">
                <Link to={`/goals/${goal.id}/edit`} className="btn secondary">
                  Edit Goal
                </Link>

                <button
                  type="button"
                  className="btn primary"
                  onClick={toggleCheckInForm}
                  disabled={!checkInAvailability.allowed}
                >
                  {showCheckInForm
                    ? "Close Check-In"
                    : checkInAvailability.allowed
                    ? "Add Check-In"
                    : "Check-In Unavailable"}
                </button>
              </div>

              {!checkInAvailability.allowed ? (
                <p className="goal-side-note">{checkInAvailability.reason}</p>
              ) : null}
            </>
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

      {showCheckInForm && checkInAvailability.allowed ? (
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
                  <label htmlFor="checkin-value">{getCheckInValueLabel(goal)}</label>
                  <input
                    id="checkin-value"
                    type="number"
                    min="1"
                    step="1"
                    value={checkInValue}
                    onChange={(event) => setCheckInValue(event.target.value)}
                    required
                  />
                  <p className="goal-inline-field__hint">{getCheckInValueHelper(goal)}</p>
                </div>
              ) : (
                <div className="goal-inline-field">
                  <label>Completed?</label>
                  <div className="goal-inline-field__staticValue">Yes</div>
                  <p className="goal-inline-field__hint">{getCheckInValueHelper(goal)}</p>
                </div>
              )}

              <div className="goal-inline-field goal-inline-field--full">
                <label htmlFor="checkin-note">Note</label>
                <textarea
                  id="checkin-note"
                  rows="4"
                  value={checkInNote}
                  onChange={(event) => setCheckInNote(event.target.value)}
                  placeholder={getCheckInNotePlaceholder(goal)}
                />
              </div>

              <div className="goal-inline-field goal-inline-field--full">
                <label htmlFor="checkin-proof">Proof</label>
                <input
                  id="checkin-proof"
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={(event) => setCheckInProof(event.target.files?.[0] || null)}
                />
                <p className="goal-inline-field__hint">
                  Upload a screenshot, photo, or document as proof for this check-in.
                </p>
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
                aria-label={`${displayCurrentProgressPercent}% complete`}
              >
                <span
                  className="goal-progress__fill"
                  style={{ width: `${displayCurrentProgressPercent}%` }}
                />
              </div>

              <div className="goal-progress__footer">
                <span>{getProgressSupportText(goal)}</span>
                <strong>{displayCurrentProgressPercent}%</strong>
              </div>
            </div>
          </article>

          <article className="goal-card goal-card--progress">
            <div className="goal-card__header">
              <h2>Overall Goal Progress</h2>
            </div>

            <div className="goal-progress">
              <div className="goal-progress__topline">
                <strong>{getOverallProgressText(goal, overallProgress)}</strong>
              </div>

              <div
                className="goal-progress__bar"
                aria-label={`${overallProgress.percent}% complete`}
              >
                <span
                  className="goal-progress__fill"
                  style={{ width: `${overallProgress.percent}%` }}
                />
              </div>

              <div className="goal-progress__footer">
                <span>{getOverallProgressSupportText(goal)}</span>
                <strong>{overallProgress.percent}%</strong>
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
              <h2>Accountability Buddy</h2>
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
                No buddy assigned yet. Invite one of your accepted connections to review
                check-ins for this goal.
              </p>
            )}

            {hasAcceptedBuddy ? (
              <p className="goal-side-note">
                Accepted buddies can review pending check-ins and help keep this goal on
                track.
              </p>
            ) : null}

            {!hasAcceptedBuddy && hasPendingBuddy ? (
              <p className="goal-side-note">
                You have a buddy invitation waiting for a response.
              </p>
            ) : null}

            {!hasAcceptedBuddy && !hasPendingBuddy && declinedAssignments.length > 0 ? (
              <p className="goal-side-note">
                A previous buddy invitation was declined. You can invite someone else from
                your connections.
              </p>
            ) : null}

            {!hasAcceptedBuddy && !hasPendingBuddy && sortedAssignments.length === 0 ? (
              <p className="goal-side-note">
                You need at least one accepted connection before you can assign a buddy.
              </p>
            ) : null}

            {isOwner ? (
              <>
                <div className="goal-card__footerAction">
                  <button
                    type="button"
                    className="btn primary"
                    onClick={toggleAssignForm}
                  >
                    {showAssignForm ? "Close Assign Buddy" : assignButtonLabel}
                  </button>
                </div>

                <div className="goal-card__footerAction">
                  <Link to="/connections" className="btn secondary">
                    Manage Connections
                  </Link>
                </div>

                {showAssignForm ? (
                  <>
                    {loadingConnections ? (
                      <p className="goal-empty-text">Loading accepted connections...</p>
                    ) : availableConnections.length ? (
                      <form className="goal-inline-form" onSubmit={handleAssignBuddy}>
                        <div className="goal-inline-form__grid">
                          <div className="goal-inline-field goal-inline-field--full">
                            <label>Choose a buddy</label>

                            <FormDropdown
                              value={selectedBuddyId}
                              options={availableConnections.map((person) => ({
                                value: String(person.id),
                                label: person.name,
                              }))}
                              onChange={(val) => setSelectedBuddyId(val)}
                              placeholder="Select a connection"
                            />
                          </div>
                        </div>

                        <div className="goal-inline-form__actions">
                          <button
                            type="submit"
                            className="btn primary"
                            disabled={assigningBuddy}
                          >
                            {assigningBuddy ? "Sending..." : "Send Buddy Invite"}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <p className="goal-empty-text">
                          You do not have any accepted connections available to assign yet.
                        </p>
                        <p className="goal-side-note">
                          Visit Connections to send invites, accept requests, or grow your
                          accountability circle.
                        </p>
                      </>
                    )}
                  </>
                ) : null}
              </>
            ) : null}
          </article>

          <article className="goal-card">
            <div className="goal-card__header">
              <h2>This Period Totals</h2>
            </div>

            <div className="goal-totals-grid">
              <div className="goal-total-card">
                <span className="goal-total-card__label">Pending</span>
                <strong className="goal-total-card__value">
                  {currentPeriodPending.length}
                </strong>
              </div>

              <div className="goal-total-card">
                <span className="goal-total-card__label">Approved</span>
                <strong className="goal-total-card__value">
                  {currentPeriodApproved.length}
                </strong>
              </div>

              <div className="goal-total-card">
                <span className="goal-total-card__label">Rejected</span>
                <strong className="goal-total-card__value">
                  {currentPeriodRejected.length}
                </strong>
              </div>

              <div className="goal-total-card">
                <span className="goal-total-card__label">Total submitted</span>
                <strong className="goal-total-card__value">
                  {currentPeriodCheckins.length}
                </strong>
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

            <div className="goal-details-grid">
              <div className="goal-detail-item">
                <span className="goal-detail-item__label">Owner</span>
                <strong className="goal-detail-item__value">{ownerName}</strong>
              </div>

              <div className="goal-detail-item">
                <span className="goal-detail-item__label">Status</span>
                <strong className="goal-detail-item__value">
                  {formatStatus(goal.status)}
                </strong>
              </div>

              <div className="goal-detail-item">
                <span className="goal-detail-item__label">How you’re tracking it</span>
                <strong className="goal-detail-item__value">
                  {formatTrackingLabel(goal.metric_type)}
                </strong>
              </div>

              <div className="goal-detail-item">
                <span className="goal-detail-item__label">Frequency</span>
                <strong className="goal-detail-item__value">
                  {formatFrequency(goal.period)}
                </strong>
              </div>

              <div className="goal-detail-item">
                <span className="goal-detail-item__label">Goal target</span>
                <strong className="goal-detail-item__value">
                  {formatTarget(goal)}
                </strong>
              </div>

              <div className="goal-detail-item">
                <span className="goal-detail-item__label">Start date</span>
                <strong className="goal-detail-item__value">
                  {formatDate(goal.start_date)}
                </strong>
              </div>

              <div className="goal-detail-item">
                <span className="goal-detail-item__label">End date</span>
                <strong className="goal-detail-item__value">
                  {goal.end_date ? formatDate(goal.end_date) : "No end date"}
                </strong>
              </div>

              <div className="goal-detail-item">
                <span className="goal-detail-item__label">Created</span>
                <strong className="goal-detail-item__value">
                  {formatDate(goal.created_at)}
                </strong>
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

      <article className="goal-card">
        <div className="goal-card__header">
          <h2>Recent Activity</h2>
        </div>

        <p className="goal-side-note">
          System history for buddy invites, check-ins, and verification activity.
        </p>

        {activityFeed.length ? (
          <>
            <div className="goal-activity-list">
              {visibleActivityFeed.map((item) => (
                <div key={item.id} className="goal-activity-row">
                  <div className="goal-activity-row__top">
                    <strong>{item.title}</strong>
                    <StatusPill tone={getActivityTone(item.type)}>
                      {getActivityPillLabel(item.type)}
                    </StatusPill>
                  </div>

                  <p className="goal-activity-row__date">
                    {formatDateTime(item.timestamp)}
                  </p>

                  {item.meta ? (
                    <p className="goal-activity-row__meta">{item.meta}</p>
                  ) : null}

                  {item.note ? (
                    <p className="goal-activity-row__note">{item.note}</p>
                  ) : null}

                  {item.proof ? (
                    <p>
                      <span className="goal-checkin-label">Proof:</span>{" "}
                      <a
                        href={item.proof}
                        target="_blank"
                        rel="noreferrer"
                        className="goal-checkin-proof-link"
                      >
                        View proof
                      </a>
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            {activityFeed.length > 6 ? (
              <div className="goal-card__footerAction">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowAllActivity((current) => !current)}
                >
                  {showAllActivity
                    ? "Show Less Activity"
                    : `View All Activity (${activityFeed.length})`}
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <p className="goal-empty-text">No activity yet.</p>
        )}
      </article>
    </section>
  );
}