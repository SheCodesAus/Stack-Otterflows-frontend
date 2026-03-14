import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authFetch } from "../api/auth-fetch";
import "./CreateGoalPage.css";

export default function CreatePodPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
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

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Please enter a pod name.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
      };

      const response = await authFetch("pods/", {
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

        throw new Error(data?.detail || "Failed to create pod.");
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
              Create a shared accountability pod where members can work toward
              goals together.
            </p>
          </header>
        </section>

        <div className="create-goal-card">
          <form className="create-goal-form" onSubmit={handleSubmit}>
            <section className="create-goal-section">
              <div className="create-goal-section__header">
                <h2>Pod details</h2>
                <p>Give your pod a name and a short description.</p>
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
                    placeholder="e.g. Study Squad"
                    required
                  />
                </div>

                <div className="create-goal-field create-goal-field--full">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="What is this pod about?"
                  />
                </div>
              </div>
            </section>

            {error ? <p className="create-goal-error">{error}</p> : null}

            <div className="create-goal-actions">
              <Link to="/pods" className="btn link">
                Cancel
              </Link>

              <button type="submit" className="btn primary" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Pod"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}