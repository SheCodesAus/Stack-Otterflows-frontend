import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { buildUrl } from "../api/auth-fetch";
import { setToken } from "../api/auth";

function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
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

  function getRedirectTarget() {
    const fromState = location.state?.from
      ? `${location.state.from.pathname || ""}${location.state.from.search || ""}${location.state.from.hash || ""}`
      : "";

    let fromStorage = "";

    try {
      fromStorage = sessionStorage.getItem("postLoginRedirect") || "";
      sessionStorage.removeItem("postLoginRedirect");
    } catch {
      // Ignore storage issues
    }

    return fromState || fromStorage || "/dashboard";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(buildUrl("auth/token/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.token) {
        throw new Error(
          data?.non_field_errors?.[0] ||
            data?.detail ||
            "Login failed. Please check your username and password."
        );
      }

      setToken(data.token);

      const redirectTo = getRedirectTarget();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          autoComplete="username"
          required
        />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          autoComplete="current-password"
          required
        />
      </div>

      {error ? <p className="auth-error">{error}</p> : null}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}

export default LoginForm;