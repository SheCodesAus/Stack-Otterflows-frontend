import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authFetch } from "../api/auth-fetch";

const categoryMap = {
  HEALTH: { label: "Health", icon: "🫀" },
  EDUCATION: { label: "Education", icon: "📚" },
  FITNESS: { label: "Fitness", icon: "💪" },
  CAREER: { label: "Career", icon: "💼" },
  CREATIVE: { label: "Creative", icon: "🎨" },
  WELLBEING: { label: "Wellbeing", icon: "🌿" },
  OTHER: { label: "Other", icon: "✨" },
};

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

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
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

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <h1>Goals</h1>
          <p>Your individual goals live here.</p>
        </div>

        <Link to="/goals/new" className="btn primary">
          Create Goal
        </Link>
      </div>

      {loading ? <p>Loading goals...</p> : null}
      {error ? <p>{error}</p> : null}

      {!loading && !error && goals.length === 0 ? (
        <div className="dashboard-panel">
          <p>No goals yet.</p>
          <Link to="/goals/new" className="btn primary">
            Create your first goal
          </Link>
        </div>
      ) : null}

      {!loading && !error && goals.length > 0 ? (
        <div className="dashboard-panel">
          <div className="dashboard-list">
            {goals.map((goal) => (
              <article key={goal.id} className="dashboard-row">
                <div className="dashboard-row__content">
                  <h3 className="dashboard-goal-title">{goal.title}</h3>

                  <div className="dashboard-goal-meta">
                    <CategoryChip category={goal.category} />

                    <span className="dashboard-goal-meta__item">
                      <span className="dashboard-goal-meta__label">Target:</span>
                      <span className="dashboard-goal-meta__value">
                        {goal.target_value} {goal.unit_label || ""}
                      </span>
                    </span>

                    <span className="dashboard-goal-meta__item">
                      <span className="dashboard-goal-meta__label">Period:</span>
                      <span className="dashboard-goal-meta__value">
                        {goal.period || "—"}
                      </span>
                    </span>

                    <span className="dashboard-goal-meta__item">
                      <span className="dashboard-goal-meta__label">Status:</span>
                      <span className="dashboard-goal-meta__value">
                        {goal.is_active ? "Active" : "Inactive"}
                      </span>
                    </span>
                  </div>
                </div>

                <Link to={`/goals/${goal.id}`} className="btn secondary">
                  View Goal
                </Link>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}