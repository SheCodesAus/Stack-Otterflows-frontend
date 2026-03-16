import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

function getErrorMessage(data, fallback) {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const firstEntry = Object.entries(data)[0];

  if (firstEntry) {
    const [field, messages] = firstEntry;
    const message = Array.isArray(messages) ? messages[0] : messages;

    if (typeof message === "string") {
      return `${field}: ${message}`;
    }
  }

  return data.detail || fallback;
}

export default function CreatePodPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    category: "OTHER",
    description: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleCategoryChange(nextValue) {
    setFormData((current) => ({
      ...current,
      category: nextValue,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    setError("");

    const trimmedName = formData.name.trim();
    const trimmedDescription = formData.description.trim();

    if (!trimmedName) {
      setError("Please enter a pod name.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await authFetch("pods/", {
        method: "POST",
        body: JSON.stringify({
          name: trimmedName,
          category: formData.category,
          description: trimmedDescription,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Failed to create pod."));
      }

      navigate(`/pods/${data.id}`);
    } catch (err) {
      setError(err.message || "Failed to create pod.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page-shell create-goal-page">
      <div className="create-goal-layout">
        <section className="create-goal-intro">
          <Link to="/pods" className="create-goal-backlink">
            <span className="create-goal-backlink__arrow">←</span>
            <span>Back to Pods</span>
          </Link>

          <header className="create-goal-header">
            <h1>Create Pod</h1>
            <p>
              Start a shared accountability pod where members can support each
              other, work toward goals together, and celebrate progress as a
              group.
            </p>
          </header>
        </section>

        <div className="create-goal-card">
          <form className="create-goal-form" onSubmit={handleSubmit}>
            <section className="create-goal-section">
              <div className="create-goal-section__header">
                <h2>Pod details</h2>
                <p>
                  Give your pod a clear name, choose a category, and add a short
                  description so people know what the group is for.
                </p>
              </div>

              <div className="create-goal-grid">
                <div className="create-goal-field create-goal-field--full">
                  <label htmlFor="name">Pod name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Morning Movement Crew"
                    maxLength={120}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="create-goal-field create-goal-field--full">
                  <label>Category</label>
                  <FormDropdown
                    value={formData.category}
                    options={categoryOptions}
                    onChange={handleCategoryChange}
                    disabled={isSubmitting}
                    placeholder="Select a category"
                  />
                  <p className="create-goal-hint">
                    Choose the main theme of this pod.
                  </p>
                </div>

                <div className="create-goal-field create-goal-field--full">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    maxLength={1000}
                    placeholder="What’s this pod about, who is it for, and what kind of goals will you work on together?"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </section>

            {error ? <p className="create-goal-error">{error}</p> : null}

            <div className="create-goal-actions">
              <Link to="/pods" className="btn create-goal-cancel-btn">
                Cancel
              </Link>

              <button
                type="submit"
                className="btn primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Pod"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}