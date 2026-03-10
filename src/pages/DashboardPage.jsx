import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import getCurrentUser from "../api/getCurrentUser";
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

const goals = [
  {
    id: 1,
    title: "Don’t eat bread or pasta, eat vegetables instead",
    category: "HEALTH",
    latestCheckInStatus: "Approved",
    buddyStatus: "Accepted",
  },
  {
    id: 2,
    title: "Work out at the gym four days a week and go for runs on the weekend",
    category: "FITNESS",
    latestCheckInStatus: "Pending",
    buddyStatus: "Accepted",
  },
  {
    id: 3,
    title: "Finish the React tutorial this week",
    category: "EDUCATION",
    latestCheckInStatus: "No check-ins yet",
    buddyStatus: "Not assigned",
  },
];

const attentionItems = [
  {
    id: 101,
    label: "Pending verification",
    description: "Sam submitted a check-in for Gym 4x/week.",
    actionLabel: "Review Check-in",
    actionTo: "/goals/2",
  },
  {
    id: 102,
    label: "Pending verification",
    description: "Pod Study Playwright has a check-in waiting for review.",
    actionLabel: "Review Check-in",
    actionTo: "/pods/1",
  },
];

const pods = [
  {
    id: 1,
    name: "Pod Study Playwright",
    summary: "Finish the tutorial and complete every exercise.",
  },
  {
    id: 2,
    name: "Pod The Mindful Time",
    summary: "Meditate for 20 minutes every day.",
  },
];

const notifications = [
  "You have 1 pending buddy approval.",
  "You have 1 pending pod check-in.",
];

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

export default function DashboardPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to load current user:", error);
      }
    }

    loadUser();
  }, []);

  const welcomeName =
    user?.display_name?.trim() || user?.username?.trim() || "";

  return (
    <section className="page-shell dashboard-page">
      <section className="dashboard-intro-panel">
        <header className="dashboard-hero">
          <h1>{welcomeName ? `Welcome back, ${welcomeName}` : "Welcome back"}</h1>
          <p>Here’s your accountability snapshot for this week.</p>
        </header>

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
            <strong>3</strong>
          </div>

          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Pending check-ins</span>
            <strong>1</strong>
          </div>

          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Active pods</span>
            <strong>2</strong>
          </div>

          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Active pod goals</span>
            <strong>4</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>My Goals</h2>
          <Link to="/goals" className="btn link">
            View all
          </Link>
        </div>

        <div className="dashboard-list">
          {goals.map((goal) => {
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
                        {goal.buddyStatus}
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
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Needs My Attention</h2>
        </div>

        <div className="dashboard-list">
          {attentionItems.map((item) => (
            <article
              key={item.id}
              className="dashboard-row dashboard-row--stacked"
            >
              <div className="dashboard-row__content">
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
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>My Pods</h2>
          <Link to="/pods" className="btn link">
            View all
          </Link>
        </div>

        <div className="dashboard-list">
          {pods.map((pod) => (
            <article
              key={pod.id}
              className="dashboard-row dashboard-row--stacked"
            >
              <div className="dashboard-row__content">
                <h3>{pod.name}</h3>
                <p>{pod.summary}</p>
              </div>

              <Link to={`/pods/${pod.id}`} className="btn secondary">
                View Pod
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>My Notifications</h2>
          <Link to="/connections" className="btn link">
            Open Connections
          </Link>
        </div>

        <ul className="dashboard-notifications">
          {notifications.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </section>
    </section>
  );
}