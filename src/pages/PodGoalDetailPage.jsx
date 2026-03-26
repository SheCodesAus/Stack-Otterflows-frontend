import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { authFetch } from "../api/auth-fetch";
import getCurrentUser from "../api/getCurrentUser";
import { useNotifications } from "../hooks/useNotifications";
import FormDropdown from "../components/FormDropdown";
import ReasonModal from "../components/ReasonModal";
import LoadingState from "../components/LoadingState";
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

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

function getMediaUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path}`;
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
      return "Add encouragement or celebrate a pod win...";
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

function buildActivityFeed(goal, checkins, comments) {
  const items = [];

  checkins.forEach((checkin) => {
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
      proof: getMediaUrl(checkin.proof || ""),
    });

    if (checkin.status === "APPROVED" && checkin.verified_at) {
      const verifiedBy = getDisplayName(
        checkin.verified_by_display_name,
        checkin.verified_by_username,
        "Pod member"
      );

      items.push({
        id: `checkin-approved-${checkin.id}`,
        type: "checkin_approved",
        timestamp: checkin.verified_at,
        title: `${verifiedBy} approved a pod check-in`,
        meta: formatCheckInValue(goal, checkin),
      });
    }

    if (checkin.status === "REJECTED" && checkin.verified_at) {
      const verifiedBy = getDisplayName(
        checkin.verified_by_display_name,
        checkin.verified_by_username,
        "Pod member"
      );

      items.push({
        id: `checkin-rejected-${checkin.id}`,
        type: "checkin_rejected",
        timestamp: checkin.verified_at,
        title: `${verifiedBy} requested clarification on a pod check-in`,
        meta: checkin.rejection_reason || "Needs clarification",
      });
    }
  });

  comments.forEach((comment) => {
    const author = getDisplayName(
      comment.author_display_name,
      comment.author_username,
      `User ${comment.author}`
    );

    items.push({
      id: `comment-${comment.id}`,
      type: "comment_created",
      timestamp: comment.created_at,
      title: `${author} posted a ${formatCommentKind(comment.kind).toLowerCase()}`,
      meta: comment.body,
    });
  });

  return items.sort((a, b) => {
    const aTime = new Date(a.timestamp).getTime();
    const bTime = new Date(b.timestamp).getTime();
    return bTime - aTime;
  });
}

function getActivityTone(type) {
  switch (type) {
    case "checkin_approved":
      return "approved";
    case "checkin_rejected":
      return "rejected";
    case "checkin_created":
      return "pending";
    case "comment_created":
      return "active";
    default:
      return "inactive";
  }
}

function getActivityPillLabel(type) {
  switch (type) {
    case "checkin_created":
      return "Check-In";
    case "checkin_approved":
      return "Approved";
    case "checkin_rejected":
      return "Needs Clarification";
    case "comment_created":
      return "Comment";
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

export default function PodGoalDetailPage() {
  const { podId, podGoalId } = useParams();
  const { signalNotificationChange } = useNotifications();
  const [goal, setGoal] = useState(null);
  const [pod, setPod] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [comments, setComments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

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

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectCheckinId, setRejectCheckinId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectBusy, setRejectBusy] = useState(false);

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        setError("");

        const [currentUserData, goalResponse, podResponse, checkinsResponse, commentsResponse] =
          await Promise.all([
            getCurrentUser().catch(() => null),
            authFetch(`pod-goals/${podGoalId}/`),
            authFetch(`pods/${podId}/`),
            authFetch(`pod-checkins/?pod_goal=${podGoalId}`),
            authFetch(`pod-comments/?pod_goal=${podGoalId}`),
          ]);

        setCurrentUser(currentUserData);

        const goalData = await goalResponse.json().catch(() => ({}));
        const podData = await podResponse.json().catch(() => ({}));
        const checkinsData = await checkinsResponse.json().catch(() => ([]));
        const commentsData = await commentsResponse.json().catch(() => ([]));

        if (!goalResponse.ok) {
          throw new Error(
            goalData?.detail || `Failed to load pod goal (${goalResponse.status})`
          );
        }

        if (!podResponse.ok) {
          throw new Error(
            podData?.detail || `Failed to load pod (${podResponse.status})`
          );
        }

        if (!checkinsResponse.ok) {
          throw new Error(
            checkinsData?.detail || `Failed to load pod check-ins (${checkinsResponse.status})`
          );
        }

        if (!commentsResponse.ok) {
          throw new Error(
            commentsData?.detail || `Failed to load pod comments (${commentsResponse.status})`
          );
        }

        setGoal(goalData);
        setPod(podData);
        setCheckins(Array.isArray(checkinsData) ? checkinsData : []);
        setComments(Array.isArray(commentsData) ? commentsData : []);
        setShowAllActivity(false);
      } catch (err) {
        setError(err.message || "Something went wrong while loading the pod goal.");
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [podId, podGoalId]);

  useEffect(() => {
    if (!goal) return;

    if (goal.metric_type === "BINARY") {
      setCheckInValue("1");
    } else {
      setCheckInValue(String(goal.target_value || 1));
    }
  }, [goal]);

//   const isGoalCreator = useMemo(() => {
//     if (!goal || !currentUser) return false;
//     return currentUser.id === goal.created_by;
//   }, [goal, currentUser]);

  const activeMembers = useMemo(() => {
    if (!pod?.memberships) return [];
    return pod.memberships.filter((member) => member.status === "ACTIVE");
  }, [pod]);

  const canVerifyCheckins = useMemo(() => {
    if (!currentUser || !activeMembers.length) return false;
    return activeMembers.some((member) => member.user === currentUser.id);
  }, [activeMembers, currentUser]);

  const sortedCheckins = useMemo(() => {
    return [...checkins].sort((a, b) => {
      const aDate = new Date(a.period_start || a.created_at).getTime();
      const bDate = new Date(b.period_start || b.created_at).getTime();
      return bDate - aDate;
    });
  }, [checkins]);

  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      return bDate - aDate;
    });
  }, [comments]);

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

  const activityFeed = useMemo(
    () => buildActivityFeed(goal, sortedCheckins, sortedComments),
    [goal, sortedCheckins, sortedComments]
  );

  const visibleActivityFeed = useMemo(() => {
    if (showAllActivity) return activityFeed;
    return activityFeed.slice(0, 6);
  }, [activityFeed, showAllActivity]);

  const currentPeriodCompletedValue = useMemo(() => {
    if (!goal) return 0;

    if (goal.metric_type === "BINARY") {
      return currentPeriodCheckins.some((checkin) => checkin.status !== "REJECTED")
        ? 1
        : 0;
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

  const goalCreatorName = useMemo(() => {
    if (!goal) return "";
    return goal.created_by_display_name || goal.created_by_username || "Unknown";
  }, [goal]);

  const checkInAvailability = useMemo(() => canAddCheckIn(goal), [goal]);

  function clearActionMessages() {
    setActionError("");
    setActionSuccess("");
  }

  function toggleCheckInForm() {
    if (!checkInAvailability.allowed) return;
    clearActionMessages();
    setShowCheckInForm((current) => !current);
  }

  async function refreshPageData() {
    const [goalResponse, checkinsResponse, commentsResponse] = await Promise.all([
      authFetch(`pod-goals/${podGoalId}/`),
      authFetch(`pod-checkins/?pod_goal=${podGoalId}`),
      authFetch(`pod-comments/?pod_goal=${podGoalId}`),
    ]);

    const goalData = await goalResponse.json().catch(() => ({}));
    const checkinsData = await checkinsResponse.json().catch(() => ([]));
    const commentsData = await commentsResponse.json().catch(() => ([]));

    if (!goalResponse.ok) {
      throw new Error(goalData?.detail || "Failed to refresh pod goal.");
    }

    if (!checkinsResponse.ok) {
      throw new Error(checkinsData?.detail || "Failed to refresh pod check-ins.");
    }

    if (!commentsResponse.ok) {
      throw new Error(commentsData?.detail || "Failed to refresh pod comments.");
    }

    setGoal(goalData);
    setCheckins(Array.isArray(checkinsData) ? checkinsData : []);
    setComments(Array.isArray(commentsData) ? commentsData : []);
  }

async function handleApprove(checkinId) {
  try {
    clearActionMessages();

    const response = await authFetch(`pod-checkins/${checkinId}/approve/`, {
      method: "POST",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.detail || "Failed to approve check-in.");
    }

    setActionSuccess("Pod check-in approved.");
    await refreshPageData();
    await signalNotificationChange();
  } catch (err) {
    setActionError(err.message || "Failed to approve check-in.");
  }
}

  function handleReject(checkinId) {
    setRejectCheckinId(checkinId);
    setRejectReason("");
    setRejectModalOpen(true);
  }

  async function submitReject() {
    if (rejectCheckinId == null) return;

    try {
      setRejectBusy(true);
      clearActionMessages();

      const response = await authFetch(`pod-checkins/${rejectCheckinId}/reject/`, {
        method: "POST",
        body: JSON.stringify({ reason: rejectReason }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to reject check-in.");
      }

      setActionSuccess("Pod check-in rejected.");
      setRejectModalOpen(false);
      setRejectCheckinId(null);
      setRejectReason("");
      await refreshPageData();
      await signalNotificationChange();
    } catch (err) {
      setActionError(err.message || "Failed to reject check-in.");
    } finally {
      setRejectBusy(false);
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
    formData.append("pod_goal", String(goal.id));
    formData.append("period_start", checkInDate);
    formData.append("value", String(value));
    formData.append("note", checkInNote.trim());

    if (checkInProof) {
      console.log("checkInProof:", checkInProof);
      console.log("is File:", checkInProof instanceof File);
      console.log("name:", checkInProof?.name);
      formData.append("proof", checkInProof);
    }

    const response = await authFetch("pod-checkins/", {
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

      throw new Error(data?.detail || "Failed to create pod check-in.");
    }

    setCheckInNote("");
    setCheckInProof(null);
    setShowCheckInForm(false);
    setActionSuccess("Pod check-in submitted.");
    await refreshPageData();
    await signalNotificationChange();
  } catch (err) {
    setActionError(err.message || "Failed to create pod check-in.");
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

    const response = await authFetch("pod-comments/", {
      method: "POST",
      body: JSON.stringify({
        pod_goal: goal.id,
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
    await refreshPageData();
    await signalNotificationChange();
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
        <Link to={`/pods/${podId}`} className="goal-detail-backlink">
          <span aria-hidden="true">←</span>
          <span>Back to Pod</span>
        </Link>
      </div>

      <LoadingState
        title="Loading pod goal"
        message="Getting the shared goal details, check-ins, and comments ready."
      />
    </section>
  );
}

  if (error) {
    return (
      <section className="page-shell goal-detail-page">
        <div className="goal-detail-topbar">
          <Link to={`/pods/${podId}`} className="goal-detail-backlink">
            <span aria-hidden="true">←</span>
            <span>Back to Pod</span>
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
          <Link to={`/pods/${podId}`} className="goal-detail-backlink">
            <span aria-hidden="true">←</span>
            <span>Back to Pod</span>
          </Link>
        </div>
        <p>Pod goal not found.</p>
      </section>
    );
  }

  return (
    <section className="page-shell goal-detail-page">
      <div className="goal-detail-topbar">
        <Link to={`/pods/${podId}`} className="goal-detail-backlink">
          <span aria-hidden="true">←</span>
          <span>Back to Pod</span>
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

          <div className="goal-detail-hero__actions">
            <Link
              to={`/pods/${podId}/goals/${goal.id}/edit`}
              className="btn secondary"
            >
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
                  Upload a screenshot, photo, or document as proof for this pod check-in.
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
                {pendingCheckins.map((checkin) => {
                  const isOwnCheckIn = currentUser?.id === checkin.created_by;

                  return (
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

                      {canVerifyCheckins && !isOwnCheckIn ? (
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
                  );
                })}
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
                            "Pod member"}{" "}
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
                            "Pod member"}{" "}
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
              <h2>Pod Members</h2>
            </div>

            {activeMembers.length ? (
              <div className="goal-assignment-list">
                {activeMembers.map((member) => (
                  <div key={member.id} className="goal-assignment-row">
                    <div>
                      <strong>
                        {member.user_display_name ||
                          member.user_username ||
                          `User ${member.user}`}
                      </strong>
                    </div>

                    <StatusPill tone="active">{formatStatus(member.role)}</StatusPill>
                  </div>
                ))}
              </div>
            ) : (
              <p className="goal-empty-text">No active members yet.</p>
            )}

            <p className="goal-side-note">
              Active pod members can review each other’s pending check-ins, but no one
              can verify their own.
            </p>

            <div className="goal-card__footerAction">
              <Link to={`/pods/${podId}`} className="btn secondary">
                Back to Pod
              </Link>
            </div>
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
    Pending check-ins stay here until another pod member reviews them.
  </p>
</article>

          <article className="goal-card">
  <div className="goal-card__header">
    <h2>Goal Details</h2>
  </div>

  <div className="goal-details-grid">
    <div className="goal-detail-item">
      <span className="goal-detail-item__label">Pod</span>
      <strong className="goal-detail-item__value">
        {pod?.name || "Unknown pod"}
      </strong>
    </div>

    <div className="goal-detail-item">
      <span className="goal-detail-item__label">Created by</span>
      <strong className="goal-detail-item__value">{goalCreatorName}</strong>
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
          System history for pod check-ins, reviews, and comment activity.
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

      <ReasonModal
        open={rejectModalOpen}
        title="Reject pod check-in"
        label="Reason for rejection"
        placeholder="Add a reason..."
        value={rejectReason}
        onChange={setRejectReason}
        onClose={() => {
          if (rejectBusy) return;
          setRejectModalOpen(false);
          setRejectCheckinId(null);
          setRejectReason("");
        }}
        onSubmit={submitReject}
        submitLabel="Reject pod check-in"
        busy={rejectBusy}
      />
    </section>
  );
}