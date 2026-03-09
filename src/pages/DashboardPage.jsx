import { Link } from "react-router-dom";
import "./DashboardPage.css";

const goals = [
  {
    id: 1,
    title: "Don’t eat bread or pasta: eat vegetables instead",
  },
  {
    id: 2,
    title: "Work out at the gym four days a week, and go for runs on the weekend",
  },
];

const pods = [
  {
    id: 1,
    name: "Pod Study Playwright",
    summary: "Goal 1 Finishing the tutorial and complete every exercise",
  },
  {
    id: 2,
    name: "Pod The Mindful Time",
    summary: "Goal 1 Meditate 20 minutes every day",
  },
];

const notifications = [
  "You have 1 pending buddy approval",
  "You have 1 pending pod check-in",
];

export default function DashboardPage() {
  return (
    <section className="page-shell">
      <header className="dashboard-hero">
        <h1>Welcome back, Eleanor</h1>
        <p>Here’s your accountability snapshot for this week.</p>
      </header>

      <section className="dashboard-actions">
        <Link to="/goals/new" className="btn primary">
          Create Goal
        </Link>

        <Link to="/pods/new" className="btn primary">
          Create Pod
        </Link>

        <Link to="/connections" className="btn primary">
          Invite Buddy
        </Link>
      </section>

      <section className="dashboard-panel">
        <h2>Weekly Snapshot</h2>

        <div className="dashboard-stats">
          <div className="dashboard-stat">
            <span className="dashboard-stat__label">Active goals</span>
            <strong>2</strong>
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
          {goals.map((goal) => (
            <article key={goal.id} className="dashboard-row">
              <div className="dashboard-row__content">
                <p>{goal.title}</p>
              </div>

              <Link to={`/goals/${goal.id}`} className="btn secondary">
                View Goal
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
            <article key={pod.id} className="dashboard-row dashboard-row--stacked">
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