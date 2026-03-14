import { useMemo, useState } from "react";
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
    description: "Great for goals your pod either completed or didn’t complete.",
  },
  {
    value: "COUNT",
    label: "Number of times",
    description: "For pod goals like 3 study sessions or 5 shared workouts.",
  },
  {
    value: "DURATION",
    label: "Amount of time",
    description: "For pod goals measured in time, like reading or meditation.",
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

export default function CreatePodGoalPage() {
  const navigate = useNavigate();
  const { podId } = useParams();

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
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBinary = formData.metric_type === "BINARY";
  const isDuration = formData.metric_type === "DURATION";
  const isCount = formData.metric_type === "COUNT";

  const trackingOption = useMemo(
    () => trackingOptions.find((option) => option.value === formData.metric_type),
    [formData.metric_type]
  );

  const periodWord = formData.period === "DAILY" ? "day" : "week";
  const durationWord = formData.duration_unit === "hours" ? "hours" : "minutes";

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
          next.unit_label = "";
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
        pod: podId,
        title: formData.title.trim(),
        motivation: formData.motivation.trim(),
        category: formData.category,
        metric_type: formData.metric_type,
        period: formData.period,
        target_value: targetValue,
        unit_label: unitLabel,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      const response = await authFetch("pod-goals/", {
        method: "POST",
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

        throw new Error(data?.detail || "Failed to create pod goal.");
      }

      navigate(`/pods/${podId}`);
    } catch (err) {
      setError(err.message || "Failed to create pod goal.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page-shell create-goal-page">
      <div className="create-goal-layout">
        <section className="create-goal-intro">
          <Link to={`/pods/${podId}`} className="create-goal-backlink">
            <span className="create-goal-backlink__arrow">←</span>
            <span>Back to Pod</span>
          </Link>

          <header className="create-goal-header">
            <h1>Create Pod Goal</h1>
            <p>
              Set up a shared goal your pod can track, check in on, and work
              toward together.
            </p>
          </header>
        </section>

        <div className="create-goal-card">
          <form className="create-goal-form" onSubmit={handleSubmit}>
            <section className="create-goal-section">
              <div className="create-goal-section__header">
                <h2>What your pod is aiming for</h2>
                <p>Give your pod goal a clear title and a reason it matters.</p>
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
                    placeholder="e.g. Study together 3 times"
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
                    placeholder="Why does this goal matter to your pod?"
                  />
                </div>
              </div>
            </section>

            <div className="create-goal-divider" />

            <section className="create-goal-section">
              <div className="create-goal-section__header">
                <h2>How your pod will track it</h2>
                <p>Choose the type of goal and how often your pod will do it.</p>
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
                        placeholder="e.g. sessions, workouts"
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
                <h2>Optional dates</h2>
                <p>
                  Add a start and end date if this pod goal has a defined
                  timeframe.
                </p>
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
              </div>
            </section>

            {error ? <p className="create-goal-error">{error}</p> : null}

            <div className="create-goal-actions">
              <Link to={`/pods/${podId}`} className="btn link">
                Cancel
              </Link>

              <button type="submit" className="btn primary" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Pod Goal"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
