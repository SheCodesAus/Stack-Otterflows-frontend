import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { authFetch } from "../api/auth-fetch";
import { useNotifications } from "../hooks/useNotifications";

export default function ClaimConnectionInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { signalNotificationChange } = useNotifications();

  const [message, setMessage] = useState("Sending connection invite...");
  const [error, setError] = useState("");

  useEffect(() => {
    async function claimInvite() {
      try {
        setError("");
        setMessage("Sending connection invite...");

        const response = await authFetch(
          `connection-invites/qr/${token}/claim/`,
          { method: "POST" }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.detail || "Could not claim this QR invite.");
        }

        setMessage("Connection invite sent.");
        await signalNotificationChange();

        window.setTimeout(() => {
          navigate("/connections");
        }, 1200);
      } catch (err) {
        setError(err.message || "Could not claim this QR invite.");
        setMessage("");
      }
    }

    if (token) {
      claimInvite();
    }
  }, [token, navigate, signalNotificationChange]);

  return (
    <section className="page-shell">
      <section className="connections-panel">
        <div className="connections-panel__header">
          <div>
            <h1>Claim connection</h1>
            <p className="connections-panel__subtext">
              We’re linking you through the QR invite.
            </p>
          </div>
        </div>

        {message ? (
          <div className="connections-state-card">
            <p>{message}</p>
          </div>
        ) : null}

        {error ? (
          <div className="connections-state-card connections-state-card--error">
            <p>{error}</p>
          </div>
        ) : null}
      </section>
    </section>
  );
}