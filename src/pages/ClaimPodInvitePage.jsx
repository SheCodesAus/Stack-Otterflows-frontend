import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { authFetch } from "../api/auth-fetch";

export default function ClaimPodInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [podId, setPodId] = useState(null);
  const [podName, setPodName] = useState("");
  const [membershipId, setMembershipId] = useState(null);
  const [inviteReady, setInviteReady] = useState(false);

  useEffect(() => {
    async function claimInvite() {
      try {
        setLoading(true);
        setError("");
        setFeedback("");

        const response = await authFetch(`pods/join/${token}/claim/`, {
          method: "POST",
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.detail || "Could not claim this pod invite.");
        }

        setPodId(data?.pod_id || null);
        setPodName(data?.pod_name || "this pod");
        setMembershipId(data?.membership_id || null);
        setInviteReady(true);
        setFeedback(data?.detail || "You now have an invite to join this pod.");
      } catch (err) {
        setError(err.message || "Could not claim this pod invite.");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      claimInvite();
    }
  }, [token]);

  async function handleAccept() {
    if (!membershipId) return;

    try {
      setActing(true);
      setError("");
      setFeedback("");

      const response = await authFetch(`pod-memberships/${membershipId}/accept/`, {
        method: "POST",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || "Could not accept this pod invite.");
      }

      setInviteReady(false);
      setFeedback("You’ve joined the pod.");
    } catch (err) {
      setError(err.message || "Could not accept this pod invite.");
    } finally {
      setActing(false);
    }
  }

  async function handleDecline() {
    if (!membershipId) return;

    try {
      setActing(true);
      setError("");
      setFeedback("");

      const response = await authFetch(`pod-memberships/${membershipId}/decline/`, {
        method: "POST",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || "Could not decline this pod invite.");
      }

      setInviteReady(false);
      setFeedback("Pod invite declined.");
    } catch (err) {
      setError(err.message || "Could not decline this pod invite.");
    } finally {
      setActing(false);
    }
  }

  return (
    <section className="page-shell">
      <section className="connections-panel">
        <div className="connections-panel__header">
          <div>
            <h1>Join Pod</h1>
            <p className="connections-panel__subtext">
              We’re getting your pod invite ready.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="connections-state-card">
            <p>Checking your pod invite...</p>
          </div>
        ) : null}

        {feedback ? (
          <div className="connections-feedback-card">
            <p>{feedback}</p>
          </div>
        ) : null}

        {error ? (
          <div className="connections-state-card connections-state-card--error">
            <p>{error}</p>
          </div>
        ) : null}

        {!loading && !error ? (
          <div className="connections-list">
            <article className="connection-row-card">
              <div className="connection-row-card__main">
                <div className="connection-row-card__top">
                  <div className="connection-row-card__identity">
                    <h3>{podName || "Pod"}</h3>
                    <p className="connection-row-card__username">
                      You can accept this invite to join the pod.
                    </p>
                  </div>
                </div>
              </div>

              {inviteReady ? (
                <div className="connection-row-card__actions">
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={handleDecline}
                    disabled={acting}
                  >
                    {acting ? "Working..." : "Decline"}
                  </button>

                  <button
                    type="button"
                    className="btn primary"
                    onClick={handleAccept}
                    disabled={acting}
                  >
                    {acting ? "Working..." : "Accept"}
                  </button>
                </div>
              ) : (
                <div className="connection-row-card__actions">
                  {podId ? (
                    <button
                      type="button"
                      className="btn primary"
                      onClick={() => navigate(`/pods/${podId}`)}
                    >
                      Go to Pod
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => navigate("/pods")}
                  >
                    Back to Pods
                  </button>
                </div>
              )}
            </article>
          </div>
        ) : null}
      </section>
    </section>
  );
}