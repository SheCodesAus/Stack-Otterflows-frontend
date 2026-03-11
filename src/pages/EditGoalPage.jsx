import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authFetch } from "../api/auth-fetch";
import FormDropdown from "../components/FormDropdown";
import "./CreateGoalPage.css";

const categoryOptions = [
  { value: "HEALTH", label: "Health", icon: "🫀" },
  { value: "EDUCATION", label: "Education", icon: "📚" },
  { value: "FITNESS", label: "Fitness", icon: "💪" },
  { value: "CAREER", label: "Career", icon: "💼" },
  { value: "CREATIVE", label: "Creative", icon: "🎨" },
  { value: "WELLBEING", label: "Wellbeing", icon: "🌿" },
  { value: "OTHER", label: "Other", icon: "✨" },
];

const trackingOptions = [
  {
    value: "BINARY",
    label: "Done / not done",
    description: "Great for goals you either completed or didn’t complete.",
  },
  {
    value: "COUNT",
    label: "Number of times",
    description: "For goals like 3 workouts per week or 5 study sessions.",
  },
  {
    value: "DURATION",
    label: "Amount of time",
    description: "For goals measured in time, like reading or meditation.",
  },
];

const frequencyOptions = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
];

const durationUnitOptions = [
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
];

const statusOptions = [
  { value: "PLANNED", label: "Planned" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
];

function getDurationPrefill(targetValue) {
  const numeric = Number(targetValue) || 0;

  if (numeric >= 60 && numeric % 60 === 0) {
    return {
      duration_unit: "hours",
      target_value: numeric / 60,
    };
  }

  return {
    duration_unit: "minutes",
    target_value: numeric || 20,
  };
}

export default function EditGoalPage() {
  const navigate = useNavigate();
  const { goalId } = useParams();

  const [formData, setFormData] = useState({
    title: "",
    motivation: "",
    category: "OTHER",
    metric_type: "COUNT",
    period: "WEEKLY",
    target_value: 1,
    unit_label: "",
    duration_unit: "minutes",
    start_date: "",
    end_date: "",
    status: "ACTIVE",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBinary = formData.metric_type === "BINARY";
  const isDuration = formData.metric_type === "DURATION";
  const isCount = formData.metric_type === "COUNT";

  const trackingOption = useMemo(
    () => trackingOptions.find((option) => option.value === formData.metric_type),
    [formData.metric_type]
  );

  const statusOption = useMemo(
    () => statusOptions.find((option) => option.value === formData.status),
    [formData.status]
  );

  const periodWord = formData.period === "DAILY" ? "day" : "week";
  const durationWord = formData.duration_unit === "hours" ? "hours" : "minutes";

  useEffect(() => {
    async function loadGoal() {
      try {
        setLoading(true);
        setError("");

        const response = await authFetch(`goals/${goalId}/`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.detail || "Failed to load goal.");
        }

        if (data.metric_type === "DURATION") {
          const durationPrefill = getDurationPrefill(data.target_value);

          setFormData({
            title: data.title || "",
            motivation: data.motivation || "",
            category: data.category || "OTHER",
            metric_type: data.metric_type || "COUNT",
            period: data.period || "WEEKLY",
            target_value: durationPrefill.target_value,
            unit_label: "",
            duration_unit: durationPrefill.duration_unit,
            start_date: data.start_date || "",
            end_date: data.end_date || "",
            status: data.status || "ACTIVE",
          });
        } else {
          setFormData({
            title: data.title || "",
            motivation: data.motivation || "",
            category: data.category || "OTHER",
            metric_type: data.metric_type || "COUNT",
            period: data.period || "WEEKLY",
            target_value: data.target_value || 1,
            unit_label: data.unit_label || "",
            duration_unit: "minutes",
            start_date: data.start_date || "",
            end_date: data.end_date || "",
            status: data.status || "ACTIVE",
          });
        }
      } catch (err) {
        setError(err.message || "Failed to load goal.");
      } finally {
        setLoading(false);
      }
    }

    loadGoal();
  }, [goalId]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateField(name, value) {
    setFormData((current) => {
      const next = {
        ...current,
        [name]: value,
      };

      if (name === "metric_type") {
        if (value === "BINARY") {
          next.target_value = 1;
          next.unit_label = "";
        }

        if (value === "COUNT") {
          next.target_value = 1;
          next.unit_label = current.unit_label || "";
        }

        if (value === "DURATION") {
          next.duration_unit = "minutes";
          next.target_value = 20;
          next.unit_label = "";
        }
      }

      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const rawTargetValue = Number(formData.target_value);

    if (!formData.title.trim()) {
      setError("Please enter a goal title.");
      return;
    }

    if (!isBinary && (!rawTargetValue || rawTargetValue < 1)) {
      setError("Please enter a target greater than 0.");
      return;
    }

    try {
      setIsSubmitting(true);

      let targetValue = 1;
      let unitLabel = "";

      if (isBinary) {
        targetValue = 1;
        unitLabel = "";
      } else if (isDuration) {
        targetValue =
          formData.duration_unit === "hours"
            ? rawTargetValue * 60
            : rawTargetValue;

        unitLabel = "minutes";
      } else {
        targetValue = rawTargetValue;
        unitLabel = formData.unit_label.trim();
      }

      const payload = {
        title: formData.title.trim(),
        motivation: formData.motivation.trim(),
        category: formData.category,
        metric_type: formData.metric_type,
        period: formData.period,
        target_value: targetValue,
        unit_label: unitLabel,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        status: formData.status,
      };

      const response = await authFetch(`goals/${goalId}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const firstEntry = Object.entries(data)[0];

        if (firstEntry) {
          const [field, messages] = firstEntry;
          const message = Array.isArray(messages) ? messages[0] : messages;
          throw new Error(`${field}: ${message}`);
        }

        throw new Error(data?.detail || "Failed to update goal.");
      }

      navigate(`/goals/${goalId}`);
    } catch (err) {
      setError(err.message || "Failed to update goal.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="page-shell create-goal-page">
        <div className="create-goal-layout">
          <section className="create-goal-intro">
            <Link to={`/goals/${goalId}`} className="create-goal-backlink">
              <span className="create-goal-backlink__arrow">←</span>
              <span>Back to Goal</span>
            </Link>

            <header className="create-goal-header">
              <h1>Edit Goal</h1>
              <p>Loading goal details...</p>
            </header>
          </section>
        </div>
      </section>
    );
  }

  return (
    <section className="page-shell create-goal-page">
      <div className="create-goal-layout">
        <section className="create-goal-intro">
          <Link to={`/goals/${goalId}`} className="create-goal-backlink">
            <span className="create-goal-backlink__arrow">←</span>
            <span>Back to Goal</span>
          </Link>

          <header className="create-goal-header">
            <h1>Edit Goal</h1>
            <p>
              Update your goal settings, timing, and status without losing your
              check-ins and progress history.
            </p>
          </header>
        </section>

        <div className="create-goal-card">
          <form className="create-goal-form" onSubmit={handleSubmit}>
            <section className="create-goal-section">
              <div className="create-goal-section__header">
                <h2>What you’re aiming for</h2>
                <p>Adjust the title and motivation if your focus has changed.</p>
              </div>

              <div className="create-goal-grid">
                <div className="create-goal-field create-goal-field--full">
                  <label htmlFor="title">Goal title</label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="create-goal-field create-goal-field--full">
                  <label htmlFor="motivation">Motivation</label>
                  <textarea
                    id="motivation"
                    name="motivation"
                    value={formData.motivation}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Why does this goal matter to you?"
                  />
                </div>
              </div>
            </section>

            <div className="create-goal-divider" />

            <section className="create-goal-section">
              <div className="create-goal-section__header">
                <h2>How you’ll track it</h2>
                <p>Update the structure of the goal if you need to refine it.</p>
              </div>

              <div className="create-goal-track-layout">
                <div className="create-goal-field create-goal-field--full">
                  <span className="create-goal-label">How will you track this?</span>
                  <FormDropdown
                    value={formData.metric_type}
                    options={trackingOptions}
                    onChange={(nextValue) => updateField("metric_type", nextValue)}
                  />
                </div>

                {trackingOption?.description ? (
                  <p className="create-goal-hint create-goal-hint--context">
                    {trackingOption.description}
                  </p>
                ) : null}

                <div className="create-goal-track-grid">
                  <div className="create-goal-field">
                    <span className="create-goal-label">How often?</span>
                    <FormDropdown
                      value={formData.period}
                      options={frequencyOptions}
                      onChange={(nextValue) => updateField("period", nextValue)}
                    />
                  </div>

                  {isCount ? (
                    <div className="create-goal-field">
                      <label htmlFor="target_value">
                        How many times each {periodWord}?
                      </label>
                      <input
                        id="target_value"
                        name="target_value"
                        type="number"
                        min="1"
                        step="1"
                        value={formData.target_value}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  ) : null}

                  {isDuration ? (
                    <div className="create-goal-field">
                      <span className="create-goal-label">Time unit</span>
                      <FormDropdown
                        value={formData.duration_unit}
                        options={durationUnitOptions}
                        onChange={(nextValue) =>
                          updateField("duration_unit", nextValue)
                        }
                      />
                    </div>
                  ) : null}

                  {isBinary ? (
                    <div className="create-goal-field create-goal-field--full">
                      <div className="create-goal-binaryNote">
                        This goal will be tracked as done or not done for each
                        selected {periodWord}.
                      </div>
                    </div>
                  ) : null}

                  {isCount ? (
                    <div className="create-goal-field create-goal-field--full">
                      <label htmlFor="unit_label">What should we call those?</label>
                      <input
                        id="unit_label"
                        name="unit_label"
                        type="text"
                        value={formData.unit_label}
                        onChange={handleChange}
                        placeholder="e.g. workouts, sessions, chapters"
                      />
                    </div>
                  ) : null}

                  {isDuration ? (
                    <div className="create-goal-field create-goal-field--full">
                      <label htmlFor="target_value">
                        How many {durationWord} each {periodWord}?
                      </label>
                      <input
                        id="target_value"
                        name="target_value"
                        type="number"
                        min="1"
                        step="1"
                        value={formData.target_value}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  ) : null}

                  <div className="create-goal-field create-goal-field--full">
                    <span className="create-goal-label">Category</span>
                    <FormDropdown
                      value={formData.category}
                      options={categoryOptions}
                      onChange={(nextValue) => updateField("category", nextValue)}
                    />
                  </div>
                </div>
              </div>
            </section>

            <div className="create-goal-divider" />

            <section className="create-goal-section">
              <div className="create-goal-section__header">
                <h2>Dates and status</h2>
                <p>Adjust timing and move the goal through its lifecycle here.</p>
              </div>

              <div className="create-goal-grid">
                <div className="create-goal-field">
                  <label htmlFor="start_date">Start date</label>
                  <input
                    id="start_date"
                    name="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="create-goal-field">
                  <label htmlFor="end_date">End date</label>
                  <input
                    id="end_date"
                    name="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="create-goal-field create-goal-field--full">
                  <span className="create-goal-label">Goal status</span>
                  <FormDropdown
                    value={formData.status}
                    options={statusOptions}
                    onChange={(nextValue) => updateField("status", nextValue)}
                  />
                </div>

                {statusOption ? (
                  <p className="create-goal-hint create-goal-hint--context create-goal-field--full">
                    Current status: {statusOption.label}
                  </p>
                ) : null}
              </div>
            </section>

            {error ? <p className="create-goal-error">{error}</p> : null}

            <div className="create-goal-actions">
              <Link to={`/goals/${goalId}`} className="btn link">
                Cancel
              </Link>

              <button type="submit" className="btn primary" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}